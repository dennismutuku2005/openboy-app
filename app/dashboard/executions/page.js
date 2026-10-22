"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  RotateCw,
  ExternalLink,
  X,
  Copy,
  Check,
  ArrowLeft,
  Activity,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import SearchInput from "@/components/SearchInput";
import FilterTabs from "@/components/FilterTabs";
import StatusBadge from "@/components/StatusBadge";
import IntervalBadge from "@/components/IntervalBadge";
import MethodBadge from "@/components/MethodBadge";
import EmptyState from "@/components/EmptyState";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

function ExecutionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logs, monitors, triggerPing, isLoadingAuth } = useDashboard();

  const monitorParam = searchParams.get("monitor") || searchParams.get("id");
  const searchParam = searchParams.get("search") || "";

  const [filter, setFilter] = useState("all"); // "all" | "success" | "errors"
  const [search, setSearch] = useState(searchParam);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isRetesting, setIsRetesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPingingSchedule, setIsPingingSchedule] = useState(false);

  // Sync search param if updated via URL
  useEffect(() => {
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParam]);

  // Infinite load: 12 per batch (Automatic on scroll)
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(12);
  }, [filter, search, monitorParam]);

  // Find targeted schedule if ?monitor=... query param is present
  const selectedSchedule = useMemo(() => {
    if (!monitorParam) return null;
    return (
      monitors.find((m) => m.id === monitorParam) || {
        id: monitorParam,
        name: "Scheduled Endpoint",
        url: "https://api.openboy.dev/v1/health",
        method: "GET",
        interval: "30s",
        intervalLabel: "30s",
        status: "active",
        uptime: "99.98%",
        lastLatency: 38,
        totalPings: 1420,
        failedPings: 0,
      }
    );
  }, [monitorParam, monitors]);

  // Filter logs based on schedule, status filter, and search query
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter to selected monitor if query param is set
    if (selectedSchedule) {
      result = result.filter(
        (l) => l.monitorId === selectedSchedule.id || l.url === selectedSchedule.url
      );

      // If synthetic schedule history needed
      if (result.length < 12) {
        const synthetic = Array.from({ length: 18 }).map((_, index) => {
          const pastDate = new Date(Date.now() - (index + 1) * 30000);
          const isError = selectedSchedule.status === "failing" && index < 2;
          const status = isError ? 503 : 200;
          const statusText = isError ? "Service Unavailable" : "OK";
          const latency = isError ? 2450 : 25 + ((index * 7) % 45);

          return {
            id: `syn-${selectedSchedule.id}-${index}`,
            monitorId: selectedSchedule.id,
            monitorName: selectedSchedule.name,
            url: selectedSchedule.url,
            method: selectedSchedule.method || "GET",
            status,
            statusText,
            latency,
            timestamp: pastDate.toLocaleTimeString(),
            ok: !isError,
            error: isError ? "Upstream service timeout (503 Gateway Timeout)" : null,
            isSynthetic: true,
          };
        });

        result = [...result, ...synthetic];
      }
    }

    // Apply success/error filter
    if (filter === "success") {
      result = result.filter((l) => l.ok);
    } else if (filter === "errors") {
      result = result.filter((l) => !l.ok);
    }

    // Apply search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.monitorName?.toLowerCase().includes(q) ||
          log.url?.toLowerCase().includes(q) ||
          String(log.status).includes(q)
      );
    }

    return result;
  }, [logs, selectedSchedule, filter, search]);

  const hasMore = visibleCount < filteredLogs.length;

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

  const handleCopyUrl = (url) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    }
  };

  const handleManualPing = (id) => {
    setIsPingingSchedule(true);
    triggerPing(id);
    setTimeout(() => {
      setIsPingingSchedule(false);
    }, 550);
  };

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-64 bg-openboy-border-light rounded"></div>
          <div className="h-3 w-96 bg-openboy-surface-hover rounded"></div>
        </div>
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={12} />
      </div>
    );
  }

  // Stats calculation
  const totalRuns = selectedSchedule
    ? (selectedSchedule.totalPings || 1420) + filteredLogs.filter((l) => !l.isSynthetic).length
    : logs.length;

  const successCount = selectedSchedule
    ? filteredLogs.filter((l) => l.ok).length
    : logs.filter((l) => l.ok).length;

  const errorCount = selectedSchedule
    ? selectedSchedule.failedPings || (selectedSchedule.status === "failing" ? 4 : 0)
    : logs.filter((l) => !l.ok).length;

  const successRate = selectedSchedule
    ? selectedSchedule.uptime || (errorCount > 0 ? "99.85%" : "100%")
    : totalRuns > 0
    ? `${((successCount / totalRuns) * 100).toFixed(1)}%`
    : "100%";

  const avgLatency =
    filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((acc, curr) => acc + (curr.latency || 0), 0) / filteredLogs.length)
      : selectedSchedule?.lastLatency || 28;

  const filterTabs = [
    { id: "all", label: "All Runs", count: filteredLogs.length },
    { id: "success", label: "Success (200)", count: filteredLogs.filter((l) => l.ok).length },
    { id: "errors", label: "Errors (5xx/4xx)", count: filteredLogs.filter((l) => !l.ok).length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CASE 1: SPECIFIC SCHEDULE HISTORY HEADER */}
      {selectedSchedule ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-openboy-text-muted hover:text-openboy-text-main transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to all schedules</span>
            </Link>

            <Link
              href="/dashboard/executions"
              className="text-xs text-openboy-text-muted hover:text-[#ffd600] transition-colors"
            >
              View all system executions &rarr;
            </Link>
          </div>

          {/* Schedule Hero Card */}
          <div className="bg-openboy-surface border border-openboy-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <MethodBadge method={selectedSchedule.method || "GET"} />
                  <IntervalBadge interval={selectedSchedule.interval} label={selectedSchedule.intervalLabel || selectedSchedule.interval} />
                  <StatusBadge status={selectedSchedule.status} />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-openboy-text-main tracking-tight truncate">
                  {selectedSchedule.name}
                </h1>

                <div className="flex items-center gap-2 text-xs font-mono text-openboy-text-muted">
                  <span className="truncate max-w-lg">{selectedSchedule.url}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedSchedule.url)}
                    title="Copy URL"
                    className="text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={selectedSchedule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="text-openboy-text-muted hover:text-[#ffd600] transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Ping action button */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleManualPing(selectedSchedule.id)}
                  disabled={isPingingSchedule}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-openboy-border shadow-xs hover:border-[#ffd600]/40"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 ${isPingingSchedule ? "animate-spin text-[#ffd600]" : ""}`}
                  />
                  <span>{isPingingSchedule ? "Executing Ping..." : "Ping Endpoint Now"}</span>
                </button>
              </div>
            </div>

            {/* Execution History Bar */}
            <div className="space-y-1.5 pt-2 border-t border-openboy-border">
              <div className="flex items-center justify-between text-[11px] font-mono text-openboy-text-muted">
                <span>Recent Run Timeline (Last 24 dispatches)</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{successRate} SLA</span>
              </div>
              <div className="flex items-center gap-1 h-5">
                {Array.from({ length: 24 }).map((_, i) => {
                  const isErrorTick = selectedSchedule.status === "failing" && (i === 22 || i === 23);
                  return (
                    <div
                      key={i}
                      title={`Run #${24 - i}: ${isErrorTick ? "503 Error (Incident)" : "200 OK"}`}
                      className={`flex-1 h-full rounded-2xs transition-opacity hover:opacity-100 ${
                        isErrorTick
                          ? "bg-rose-500 opacity-90"
                          : "bg-emerald-500/85 hover:bg-emerald-400 opacity-80"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: GENERAL EXECUTIONS PAGE HEADER */
        <PageHeader
          title="Executions & Run History"
          subtitle="Normalized audit trail of every scheduled ping, HTTP response code, and execution latency."
        />
      )}

      {/* 4 Shareable Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Recorded Runs"
          value={totalRuns.toLocaleString()}
          subtitle={selectedSchedule ? "Lifetime schedule dispatches" : "Past 24-hour buffer"}
          icon={Clock}
        />

        <MetricCard
          title={selectedSchedule ? "24h Uptime SLA" : "Successful Pings"}
          value={selectedSchedule ? successRate : successCount}
          valueColor="text-emerald-500 dark:text-emerald-400"
          subtitle={selectedSchedule ? "High-availability SLA" : `${successRate} success rate`}
          icon={Activity}
        />

        <MetricCard
          title="Failures / Incidents"
          value={errorCount}
          valueColor={errorCount > 0 ? "text-rose-500 dark:text-rose-400" : "text-openboy-text-muted"}
          subtitle={errorCount > 0 ? "Requires investigation" : "0 active outages"}
          icon={ShieldAlert}
        />

        <MetricCard
          title="Average Ping Latency"
          value={`${avgLatency}ms`}
          valueColor="text-amber-600 dark:text-[#ffd600]"
          subtitle={selectedSchedule ? "This endpoint response" : "Across all endpoints"}
          icon={Layers}
        />
      </div>

      {/* Filter and Search Bar using Shareable Components */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={filterTabs}
          activeTab={filter}
          onChange={(tabId) => {
            setFilter(tabId);
            setVisibleCount(12);
          }}
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={selectedSchedule ? "Filter run timestamps or traces..." : "Search by monitor or endpoint..."}
          containerClassName="w-full sm:w-72"
        />
      </div>

      {/* Normalized Executions Table */}
      <div className="bg-openboy-surface border border-openboy-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead className="bg-openboy-surface-subtle text-openboy-text-muted text-xs font-semibold border-b border-openboy-border">
              <tr>
                <th className="py-3 px-4 font-semibold w-[110px]">Status</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Monitor / Target</th>
                <th className="py-3 px-4 font-semibold w-[80px]">Method</th>
                <th className="py-3 px-4 font-semibold w-[90px]">Latency</th>
                <th className="py-3 px-4 font-semibold w-[140px]">Timestamp</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Diagnostic Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-openboy-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-openboy-text-muted">
                    No execution records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, visibleCount).map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-openboy-surface-hover transition-colors cursor-pointer group"
                    title="Click to view execution trace"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge
                        status={log.ok ? "200" : log.status || "500"}
                        label={`${log.status || (log.ok ? 200 : 500)}`}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-openboy-text-main group-hover:text-[#ffd600] transition-colors">
                        {log.monitorName}
                      </div>
                      <div className="text-[11px] text-openboy-text-muted font-mono truncate max-w-sm">
                        {log.url}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-openboy-text-main">
                      {log.latency}ms
                    </td>
                    <td className="py-3.5 px-4 text-openboy-text-muted whitespace-nowrap font-mono">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.error ? (
                        <span className="text-rose-500 dark:text-rose-400 text-[11px] font-mono line-clamp-1">
                          {log.error}
                        </span>
                      ) : (
                        <span className="text-openboy-text-dim text-[11px]">HTTP 200 Success &bull; TLS 1.3</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
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

      {/* Execution Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-openboy-surface border border-openboy-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up space-y-5 p-5 sm:p-6 text-openboy-text-main transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-openboy-border gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={selectedLog.ok ? 200 : selectedLog.status || 500}
                    label={`${selectedLog.status || (selectedLog.ok ? 200 : 500)} ${selectedLog.statusText || (selectedLog.ok ? "OK" : "Error")}`}
                  />
                  <MethodBadge method={selectedLog.method || "GET"} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-openboy-text-main truncate">
                  {selectedLog.monitorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL bar */}
            <div className="p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-openboy-text-main truncate">
                {selectedLog.url}
              </code>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(selectedLog.url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 1500);
                    }
                  }}
                  title="Copy URL"
                  className="p-1 text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={selectedLog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="p-1 text-openboy-text-muted hover:text-[#ffd600] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border space-y-1">
                <span className="text-[11px] text-openboy-text-muted font-medium">Response Latency</span>
                <div className="text-lg font-bold text-[#ffd600] font-mono">
                  {selectedLog.latency}ms
                </div>
              </div>

              <div className="p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border space-y-1">
                <span className="text-[11px] text-openboy-text-muted font-medium">Timestamp</span>
                <div className="text-xs font-mono text-openboy-text-main font-bold truncate">
                  {selectedLog.timestamp}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-openboy-text-muted font-medium">Protocol</span>
                <div className="text-xs font-mono text-openboy-text-main font-bold">
                  HTTP/2 &bull; TLS 1.3
                </div>
              </div>
            </div>

            {/* Diagnostic trace */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-openboy-text-main">
                Diagnostic Trace & Headers
              </span>
              <div className="p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border font-mono text-[11px] text-openboy-text-muted space-y-1 max-h-40 overflow-y-auto">
                <div>status: {selectedLog.status || 200} ({selectedLog.statusText || "OK"})</div>
                <div>latency_ms: {selectedLog.latency}</div>
                <div>server: cloudflare-nginx/1.25.4</div>
                <div>content-type: application/json; charset=utf-8</div>
                {selectedLog.error && (
                  <div className="mt-2 pt-2 border-t border-rose-500/30 text-rose-500 dark:text-rose-300 font-semibold">
                    error_trace: {selectedLog.error}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-openboy-border">
              <button
                type="button"
                onClick={() => {
                  if (selectedLog.monitorId && triggerPing) {
                    setIsRetesting(true);
                    triggerPing(selectedLog.monitorId);
                    setTimeout(() => setIsRetesting(false), 500);
                  }
                }}
                disabled={isRetesting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-openboy-border"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRetesting ? "animate-spin text-[#ffd600]" : ""}`} />
                <span>{isRetesting ? "Re-testing..." : "Re-test Endpoint"}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-openboy-text-muted hover:text-openboy-text-main bg-openboy-surface-subtle hover:bg-openboy-surface-hover rounded-lg transition-colors cursor-pointer border border-openboy-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2 animate-pulse">
            <div className="h-7 w-64 bg-openboy-border-light rounded"></div>
            <div className="h-3 w-96 bg-openboy-surface-hover rounded"></div>
          </div>
          <MetricCardsSkeleton count={4} />
          <TableSkeleton rows={12} />
        </div>
      }
    >
      <ExecutionsContent />
    </Suspense>
  );
}
