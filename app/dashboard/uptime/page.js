"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, CheckCircle2, Clock, Search } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";

export default function UptimePage() {
  const { monitors, isLoadingAuth } = useDashboard();
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
          }, 350);
        }
      },
      { rootMargin: "350px" }
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
          <div className="h-7 w-64 bg-[#28321b] rounded"></div>
          <div className="h-3 w-96 bg-[#1f2615] rounded"></div>
        </div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-[#181c12] rounded-xl border border-[#273019] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header (No icon next to title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Uptime & Telemetry Metrics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Availability SLA metrics, response latency trends, and 30-day health distributions.
          </p>
        </div>

        {/* Global SLA Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f2615] border border-[#2e3720] text-xs font-mono self-start sm:self-auto">
          <span className="text-zinc-400">System Status:</span>
          <span className="text-emerald-400 font-bold">99.98% Operational</span>
        </div>
      </div>

      {/* KPI Cards (Phone responsive 2x2 grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Endpoints</span>
          <div className="text-2xl font-bold text-white">{monitors.length}</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            {monitors.filter((m) => m.status === "active").length} active now
          </span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Avg. Response Time</span>
          <div className="text-2xl font-bold text-[#ffd600] font-mono">38ms</div>
          <span className="text-[11px] text-zinc-400">Past 24-hour average</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Incident Rate (30d)</span>
          <div className="text-2xl font-bold text-white font-mono">0.02%</div>
          <span className="text-[11px] text-emerald-400">High availability</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Pings Handled</span>
          <div className="text-2xl font-bold text-white font-mono">48,290</div>
          <span className="text-[11px] text-zinc-400">Automatic cron cycles</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-zinc-400 font-mono">
          <span>Monitor Health Breakdown</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter endpoint..."
            className="pl-9 pr-4 py-1.5 bg-[#1b2013] border border-[#2b341f] rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ffd600] w-64"
          />
        </div>
      </div>

      {/* NORMALIZED UPTIME TABLE WITH INFINITE SCROLL */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead className="bg-[#212717] text-zinc-300 font-mono text-xs border-b border-[#2b341f]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Monitor / Target</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 w-72">30-Day Health Bars</th>
                <th className="py-3 px-4 text-right">Uptime SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252d1b]">
              {filtered.slice(0, visibleCount).map((mon) => {
                const isActive = mon.status === "active";
                const isFailing = mon.status === "failing";

                return (
                  <tr key={mon.id} className="hover:bg-[#202616] transition-colors">
                    {/* Status (Zero dots) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : isFailing
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-[#252c19] text-zinc-400 border-[#384328]"
                        }`}
                      >
                        {isActive ? "Active" : isFailing ? "Failing" : "Paused"}
                      </span>
                    </td>

                    {/* Monitor Name & URL */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{mon.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{mon.url}</div>
                    </td>

                    {/* Cadence */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-300">
                      {mon.intervalLabel || mon.interval}
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-zinc-200">
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
                              className={`flex-1 h-full rounded-xs ${
                                isFailingDay ? "bg-rose-500" : "bg-emerald-500/80"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </td>

                    {/* Uptime SLA */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-400">
                      {mon.uptime || "100%"}
                    </td>
                  </tr>
                );
              })}

              {/* Skeletons while loading more */}
              {isLoadingMore && (
                <TableSkeletonRows
                  rows={Math.min(12, Math.max(1, filtered.length - visibleCount))}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Invisible sentinel for automatic infinite scroll */}
        {hasMore && <div ref={loadSentinelRef} className="h-4 w-full pointer-events-none" />}
      </div>
    </div>
  );
}
