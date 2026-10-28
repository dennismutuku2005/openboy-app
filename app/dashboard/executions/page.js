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
  Trash2,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import SearchInput from "@/components/SearchInput";
import FilterTabs from "@/components/FilterTabs";
import StatusBadge from "@/components/StatusBadge";
import { executionService } from "@/services/executionService";
import { monitorService } from "@/services/monitorService";
import IntervalBadge from "@/components/IntervalBadge";
import MethodBadge from "@/components/MethodBadge";
import EmptyState from "@/components/EmptyState";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

function formatLogTime(timestamp, formattedTime) {
  if (formattedTime) return formattedTime;
  if (!timestamp) return "Just now";
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    return String(timestamp);
  } catch {
    return String(timestamp);
  }
}

function formatLogDate(timestamp) {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return "";
  } catch {
    return "";
  }
}

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
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync search param if updated via URL
  useEffect(() => {
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParam]);

  // Initial visible batch of 40 rows fills desktop viewports with a natural scrollbar
  const [visibleCount, setVisibleCount] = useState(40);
  const loadSentinelRef = useRef(null);

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(40);
  }, [filter, search, monitorParam]);

  const [targetMonitor, setTargetMonitor] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Keyboard shortcut to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedLog(null);
        setShowClearModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync targeted schedule if ?monitor=... query param is present
  useEffect(() => {
    if (!monitorParam) {
      setTargetMonitor(null);
      return;
    }
    const found = monitors.find((m) => m.id === monitorParam);
    if (found) {
      setTargetMonitor(found);
    } else {
      monitorService
        .getMonitor(monitorParam)
        .then((m) => {
          if (m) setTargetMonitor(m);
        })
        .catch(() => {});
    }
  }, [monitorParam, monitors]);

  // Load complete history directly from MySQL database (bypassing any cache)
  const fetchExecutionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const params = {
        limit: 1000,
      };
      if (monitorParam) {
        params.monitorId = monitorParam;
      }
      const data = await executionService.getExecutions(params);
      if (data && Array.isArray(data.logs)) {
        setHistoryLogs(data.logs);
      }
    } catch (err) {
      console.warn("Failed to load execution history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchExecutionHistory();
  }, [monitorParam]);

  // Purge all execution records from MySQL
  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await executionService.clearExecutions();
      setHistoryLogs([]);
      setShowClearModal(false);
    } catch (err) {
      console.error("Failed to clear execution logs:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const activeSchedule = targetMonitor || monitors.find((m) => m.id === monitorParam) || null;

  // Merge loaded history logs from database with incoming live logs from SSE stream
  const mergedLogs = useMemo(() => {
    const map = new Map();
    // 1. All historical records loaded from MySQL database
    for (const l of historyLogs) {
      if (l && l.id) map.set(l.id, l);
    }
    // 2. Incoming live SSE logs from dashboard context
    for (const l of logs) {
      if (!l || !l.id) continue;
      if (monitorParam) {
        const matchID = l.monitorId === monitorParam;
        const matchURL = activeSchedule && l.url === activeSchedule.url;
        if (!matchID && !matchURL) continue;
      }
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    }
    const all = Array.from(map.values());
    all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return all;
  }, [historyLogs, logs, monitorParam, activeSchedule]);

  // Filter logs based on status filter and search query
  const filteredLogs = useMemo(() => {
    let result = [...mergedLogs];

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
  }, [mergedLogs, filter, search]);

  const hasMore = visibleCount < filteredLogs.length;

  // Seamless auto infinite scroll on scroll without stale closures
  useEffect(() => {
    const sentinel = loadSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => {
            if (prev < filteredLogs.length) {
              return prev + 40;
            }
            return prev;
          });
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [filteredLogs.length]);

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

  // Real Stats calculation based strictly on real logs & monitor data
  const totalRuns = activeSchedule
    ? (typeof activeSchedule.totalPings === "number" && activeSchedule.totalPings > 0
        ? Math.max(activeSchedule.totalPings, filteredLogs.length)
        : filteredLogs.length)
    : (filteredLogs.length > 0 ? filteredLogs.length : logs.length);

  const successCount = filteredLogs.filter((l) => l.ok).length;
  const errorCount = activeSchedule
    ? (typeof activeSchedule.failedPings === "number" && activeSchedule.failedPings > 0
        ? Math.max(activeSchedule.failedPings, filteredLogs.filter((l) => !l.ok).length)
        : filteredLogs.filter((l) => !l.ok).length)
    : filteredLogs.filter((l) => !l.ok).length;

  const successRate = activeSchedule
    ? activeSchedule.uptime || (totalRuns > 0 ? `${(((totalRuns - errorCount) / totalRuns) * 100).toFixed(1)}%` : "100%")
    : totalRuns > 0
    ? `${(((totalRuns - errorCount) / totalRuns) * 100).toFixed(1)}%`
    : "100%";

  const avgLatency =
    filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((acc, curr) => acc + (curr.latency || 0), 0) / filteredLogs.length)
      : activeSchedule?.lastLatency || 0;

  const filterTabs = [
    { id: "all", label: "All Runs", count: filteredLogs.length },
    { id: "success", label: "Success (200)", count: successCount },
    { id: "errors", label: "Errors (5xx/4xx)", count: errorCount },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CASE 1: SPECIFIC SCHEDULE HISTORY HEADER */}
      {activeSchedule ? (
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
                  <MethodBadge method={activeSchedule.method || "GET"} />
                  <IntervalBadge interval={activeSchedule.interval} label={activeSchedule.intervalLabel || activeSchedule.interval} />
                  <StatusBadge status={activeSchedule.status} />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-openboy-text-main tracking-tight truncate">
                  {activeSchedule.name}
                </h1>

                <div className="flex items-center gap-2 text-xs font-mono text-openboy-text-muted">
                  <span className="truncate max-w-lg">{activeSchedule.url}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(activeSchedule.url)}
                    title="Copy URL"
                    className="text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={activeSchedule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="text-openboy-text-muted hover:text-[#ffd600] transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isRefreshing || isLoadingHistory}
                  onClick={async () => {
                    setIsRefreshing(true);
                    await fetchExecutionHistory();
                    setIsRefreshing(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-openboy-border shadow-xs"
                  title="Refresh latest records directly from MySQL database"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingHistory ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>

                {filteredLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Purge all execution records"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleManualPing(activeSchedule.id)}
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
                <span>Recent Run Timeline ({filteredLogs.length} total recorded)</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{successRate} SLA</span>
              </div>
              <div className="flex items-center gap-1 h-5">
                {Array.from({ length: 24 }).map((_, i) => {
                  const emptyCount = Math.max(0, 24 - filteredLogs.length);
                  if (i < emptyCount) {
                    return (
                      <div
                        key={i}
                        title="Awaiting next scheduled dispatch"
                        className="flex-1 h-full rounded-2xs bg-openboy-surface-subtle border border-openboy-border/40"
                      />
                    );
                  }
                  const logIndex = i - emptyCount;
                  const logItem = filteredLogs[filteredLogs.length - 1 - logIndex];
                  const isOk = logItem ? logItem.ok : true;
                  return (
                    <div
                      key={i}
                      title={logItem ? `Run: ${logItem.status} (${logItem.latency}ms) at ${formatLogTime(logItem.timestamp, logItem.formattedTime)}` : "Dispatched"}
                      className={`flex-1 h-full rounded-2xs transition-opacity hover:opacity-100 ${
                        isOk
                          ? "bg-emerald-500/85 hover:bg-emerald-400 opacity-80"
                          : "bg-rose-500 opacity-90"
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
          subtitle="Normalized audit trail of every scheduled ping, HTTP response code, and execution latency directly from database."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isRefreshing || isLoadingHistory}
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchExecutionHistory();
                  setIsRefreshing(false);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-openboy-border bg-openboy-surface hover:bg-openboy-surface-hover text-openboy-text-main flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh latest records directly from MySQL database"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingHistory ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              {filteredLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Purge all execution records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          }
        />
      )}

      {/* 4 Shareable Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Recorded Runs"
          value={totalRuns.toLocaleString()}
          subtitle={activeSchedule ? "Lifetime schedule dispatches" : "Past 24-hour buffer"}
          icon={Clock}
        />

        <MetricCard
          title={activeSchedule ? "24h Uptime SLA" : "Successful Pings"}
          value={activeSchedule ? successRate : successCount}
          valueColor="text-emerald-500 dark:text-emerald-400"
          subtitle={activeSchedule ? "High-availability SLA" : `${successRate} success rate`}
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
          subtitle={activeSchedule ? "This endpoint response" : "Across all endpoints"}
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
          placeholder={activeSchedule ? "Filter run timestamps or traces..." : "Search by monitor or endpoint..."}
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
              {isLoadingHistory && filteredLogs.length === 0 ? (
                <TableSkeletonRows rows={8} />
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-openboy-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-openboy-surface-subtle border border-openboy-border flex items-center justify-center text-openboy-text-muted mb-1 shadow-2xs">
                        <Activity className="w-4 h-4 text-[#ffd600]" />
                      </div>
                      <div className="font-bold text-openboy-text-main text-sm">No execution records found</div>
                      <p className="text-xs text-openboy-text-muted leading-relaxed">No execution records match the current filter or search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, visibleCount).map((log, idx) => (
                  <tr
                    key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
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
                    <td className="py-3.5 px-4 text-openboy-text-muted whitespace-nowrap font-mono text-xs">
                      <div className="text-openboy-text-main font-semibold">
                        {formatLogTime(log.timestamp, log.formattedTime)}
                      </div>
                      <div className="text-[10px] text-openboy-text-dim">
                        {formatLogDate(log.timestamp)}
                      </div>
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
          isLoadingMore={false}
        />

        {/* Pagination & Load Controls */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-openboy-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-openboy-surface-subtle/50 text-xs text-openboy-text-muted">
            <div>
              Showing <span className="font-semibold text-openboy-text-main">{Math.min(visibleCount, filteredLogs.length).toLocaleString()}</span> of{" "}
              <span className="font-semibold text-openboy-text-main">{filteredLogs.length.toLocaleString()}</span> execution records
            </div>
            {hasMore ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 40, filteredLogs.length))}
                  className="px-3.5 py-1.5 rounded-lg border border-openboy-border bg-openboy-surface hover:bg-openboy-surface-hover text-openboy-text-main font-semibold transition-colors cursor-pointer"
                >
                  Load 40 More Records
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredLogs.length)}
                  className="px-3.5 py-1.5 rounded-lg border border-openboy-border bg-openboy-surface hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
                >
                  Show All ({filteredLogs.length.toLocaleString()})
                </button>
              </div>
            ) : filteredLogs.length > 40 ? (
              <div className="text-[11px] text-openboy-text-muted">All {filteredLogs.length.toLocaleString()} records loaded</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Execution Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedLog(null)}
        >
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
                  {formatLogTime(selectedLog.timestamp, selectedLog.formattedTime)} ({formatLogDate(selectedLog.timestamp)})
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

      {/* Clear Execution Logs Confirmation Modal */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowClearModal(false)}
        >
          <div
            className="w-full max-w-md bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-openboy-text-main">Purge Execution Run History?</h3>
                <p className="text-xs text-openboy-text-muted leading-relaxed">
                  This will permanently delete all {filteredLogs.length.toLocaleString()} execution records and pings directly from MySQL database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-openboy-border">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearLogs}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging from Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Purge Audit Trail</span>
                  </>
                )}
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
