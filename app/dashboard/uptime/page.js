"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Clock, Server, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import SearchInput from "@/components/SearchInput";
import StatusBadge from "@/components/StatusBadge";
import IntervalBadge from "@/components/IntervalBadge";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

export default function UptimePage() {
  const router = useRouter();
  const { monitors, logs, isLoadingAuth } = useDashboard();
  const [search, setSearch] = useState("");

  // Infinite load: 12 per batch (Automatic on scroll)
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  // Reset pagination on search
  useEffect(() => {
    setVisibleCount(12);
  }, [search]);

  const filtered = monitors.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
    }
    return true;
  });

  const hasMore = visibleCount < filtered.length;

  // Seamless auto infinite scroll on scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 12);
            setIsLoadingMore(false);
          }, 120);
        }
      },
      { rootMargin: "150px" }
    );

    const sentinel = loadSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, isLoadingMore]);

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-64 bg-openboy-border-light rounded"></div>
          <div className="h-3 w-96 bg-openboy-surface-hover rounded"></div>
        </div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-openboy-surface rounded-xl border border-openboy-border animate-pulse"></div>
      </div>
    );
  }

  const activeEndpointsCount = monitors.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Unified Page Header */}
      <PageHeader
        title="Uptime & Telemetry Metrics"
        subtitle="Availability SLA metrics, response latency trends, and 30-day health distributions."
      />

      {/* KPI Cards (Phone responsive 2x2 grid using shareable MetricCard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Endpoints"
          value={monitors.length}
          trend={`${activeEndpointsCount} active now`}
          trendType="success"
          icon={Server}
        />

        <MetricCard
          title="Avg. Response Time"
          value="38ms"
          valueColor="text-amber-600 dark:text-[#ffd600]"
          subtitle="Past 24-hour average"
          icon={Clock}
        />

        <MetricCard
          title="Incident Rate (30d)"
          value="0.02%"
          trend="High availability"
          trendType="success"
          icon={Activity}
        />

        <MetricCard
          title="Total Pings Handled"
          value="48,290"
          subtitle="Automatic cron cycles"
          icon={CheckCircle2}
        />
      </div>

      {/* Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-openboy-text-muted font-mono">
          <span>Monitor Health Breakdown ({filtered.length} targets)</span>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter endpoint or URL..."
          containerClassName="w-full sm:w-72"
        />
      </div>

      {/* NORMALIZED UPTIME TABLE */}
      <div className="bg-openboy-surface border border-openboy-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead className="bg-openboy-surface-subtle text-openboy-text-muted font-mono text-xs border-b border-openboy-border">
              <tr>
                <th className="py-3 px-4 font-semibold w-[120px]">Status</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Monitor / Target</th>
                <th className="py-3 px-4 font-semibold w-[110px]">Cadence</th>
                <th className="py-3 px-4 font-semibold w-[90px]">Latency</th>
                <th className="py-3 px-4 w-72 font-semibold">30-Day Health Bars</th>
                <th className="py-3 px-4 text-right font-semibold w-[100px]">Uptime SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-openboy-border">
              {filtered.slice(0, visibleCount).map((mon) => {
                const isFailing = mon.status === "failing";

                return (
                  <tr
                    key={mon.id}
                    onClick={() => router.push(`/dashboard/executions?monitor=${mon.id}`)}
                    className="hover:bg-openboy-surface-hover transition-colors cursor-pointer group"
                    title="Click to view run history on executions page"
                  >
                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={mon.status} />
                    </td>

                    {/* Monitor Name & URL */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        href={`/dashboard/executions?monitor=${mon.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-openboy-text-main truncate group-hover:text-[#ffd600] transition-colors block"
                      >
                        {mon.name}
                      </Link>
                      <div className="text-[11px] text-openboy-text-muted font-mono truncate">{mon.url}</div>
                    </td>

                    {/* Cadence */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <IntervalBadge interval={mon.interval} label={mon.intervalLabel || mon.interval} />
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-openboy-text-main">
                      {mon.lastLatency || 32}ms
                    </td>

                    {/* 30-Day Health Timeline */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-0.5 h-4 w-56 sm:w-64">
                        {Array.from({ length: 30 }).map((_, i) => {
                          const isFailingDay = isFailing && i === 28;
                          return (
                            <div
                              key={i}
                              title={`Day ${i + 1}: ${isFailingDay ? "Incident (503 Error)" : "100% Operational"}`}
                              className={`flex-1 h-full rounded-2xs ${
                                isFailingDay ? "bg-rose-500" : "bg-emerald-500/80"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </td>

                    {/* Uptime SLA */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-500 dark:text-emerald-400">
                      {mon.uptime || "100%"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Shareable Infinite Scroll Sentinel */}
        <InfiniteScrollSentinel
          sentinelRef={loadSentinelRef}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      </div>
    </div>
  );
}
