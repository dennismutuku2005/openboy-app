"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Search, Filter, RotateCw, ExternalLink } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";

export default function ExecutionsPage() {
  const { logs, monitors, triggerPing, isLoadingAuth } = useDashboard();
  const [filter, setFilter] = useState("all"); // "all" | "success" | "errors"
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  // Infinite load: 12 per batch (Automatic on scroll)
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(12);
  }, [filter, search]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "success" && !log.ok) return false;
    if (filter === "errors" && log.ok) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.monitorName?.toLowerCase().includes(q) ||
        log.url?.toLowerCase().includes(q) ||
        String(log.status).includes(q)
      );
    }
    return true;
  });

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
        <TableSkeleton rows={12} />
      </div>
    );
  }

  const totalRuns = logs.length;
  const successCount = logs.filter((l) => l.ok).length;
  const errorCount = logs.filter((l) => !l.ok).length;
  const successRate = totalRuns > 0 ? ((successCount / totalRuns) * 100).toFixed(1) : 100;
  const avgLatency =
    totalRuns > 0
      ? Math.round(logs.reduce((acc, curr) => acc + (curr.latency || 0), 0) / totalRuns)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header (No icon next to title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Executions & Run History
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Normalized audit trail of every scheduled ping, HTTP response code, and execution latency.
          </p>
        </div>
      </div>

      {/* KPI Stats (Phone responsive 2x2 grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Recorded Runs</span>
          <div className="text-2xl font-bold text-white">{totalRuns}</div>
          <span className="text-[11px] text-zinc-400">Past 24-hour buffer</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Successful Pings</span>
          <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
          <span className="text-[11px] text-emerald-400 font-mono">
            {successRate}% success rate
          </span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Failures / Timeouts</span>
          <div className="text-2xl font-bold text-rose-400">{errorCount}</div>
          <span className="text-[11px] text-rose-400">Requires investigation</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Average Ping Latency</span>
          <div className="text-2xl font-bold text-[#ffd600] font-mono">
            {avgLatency}ms
          </div>
          <span className="text-[11px] text-zinc-400">Across all endpoints</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mobile Filter Dropdown (Full width left to right) */}
        <div className="sm:hidden w-full">
          <label className="text-[11px] text-zinc-400 font-mono mb-1 block">Filter Runs</label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setVisibleCount(12);
            }}
            className="w-full bg-[#1b2013] border border-[#2b341f] text-white text-xs rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:border-[#ffd600] cursor-pointer"
          >
            <option value="all">All Runs ({logs.length})</option>
            <option value="success">Success ({successCount})</option>
            <option value="errors">Errors ({errorCount})</option>
          </select>
        </div>

        {/* Desktop Filter Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setVisibleCount(12);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-[#2b351e] text-[#ffd600] font-semibold"
                : "text-zinc-400 hover:text-white bg-[#1b2013] border border-[#2b341f]"
            }`}
          >
            All Runs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("success");
              setVisibleCount(12);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "success"
                ? "bg-emerald-950/40 text-emerald-300 font-semibold border border-emerald-500/30"
                : "text-zinc-400 hover:text-emerald-300 bg-[#1b2013] border border-[#2b341f]"
            }`}
          >
            Success ({successCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("errors");
              setVisibleCount(12);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "errors"
                ? "bg-rose-950/40 text-rose-300 font-semibold border border-rose-500/30"
                : "text-zinc-400 hover:text-rose-300 bg-[#1b2013] border border-[#2b341f]"
            }`}
          >
            Errors ({errorCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by monitor or endpoint..."
            className="pl-9 pr-4 py-2 sm:py-1.5 bg-[#1b2013] border border-[#2b341f] rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ffd600] w-full"
          />
        </div>
      </div>

      {/* Normalized Executions Table with Infinite Scroll */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead className="bg-[#212717] text-zinc-300 text-xs font-semibold border-b border-[#2b341f]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Monitor / Target</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Diagnostic Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252d1b]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    No execution records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, visibleCount).map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#202616] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                          log.ok
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        <span className="font-bold">{log.status || 500}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.monitorName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
                        {log.url}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-300">
                      {log.method}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                      {log.latency}ms
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      {log.error ? (
                        <span className="text-rose-400 text-[11px] font-mono line-clamp-1">
                          {log.error}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">HTTP 200 Success</span>
                      )}
                    </td>
                  </tr>
                ))
              )}

              {/* Skeletons while loading next 12 logs */}
              {isLoadingMore && (
                <TableSkeletonRows
                  rows={Math.min(12, Math.max(1, filteredLogs.length - visibleCount))}
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
