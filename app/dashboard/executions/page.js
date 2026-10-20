"use client";

import { useState } from "react";
import { History, CheckCircle2, XCircle, Search, Filter, RotateCw, ExternalLink } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { MetricCardsSkeleton, TableSkeleton } from "@/components/DashboardSkeletons";

export default function ExecutionsPage() {
  const { logs, monitors, triggerPing, isLoadingAuth } = useDashboard();
  const [filter, setFilter] = useState("all"); // "all" | "success" | "errors"
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-64 bg-[#28321b] rounded"></div>
          <div className="h-3 w-96 bg-[#1f2615] rounded"></div>
        </div>
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={7} />
      </div>
    );
  }

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#ffd600]" />
            <span>Executions & Run History</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Audit trail of every scheduled ping, HTTP response code, and execution latency.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Recorded Runs</span>
          <div className="text-2xl font-bold text-white">{totalRuns}</div>
          <span className="text-xs text-zinc-400">Live in-memory stream</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Success Rate</span>
          <div className="text-2xl font-bold text-emerald-400">{successRate}%</div>
          <span className="text-xs text-zinc-400">{successCount} successful pings</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Average Latency</span>
          <div className="text-2xl font-bold text-[#ffd600]">{avgLatency}ms</div>
          <span className="text-xs text-zinc-400">Across all intervals</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Failed Runs</span>
          <div className="text-2xl font-bold text-rose-400">{errorCount}</div>
          <span className="text-xs text-zinc-400">5xx errors or timeouts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: `All (${totalRuns})` },
            { id: "success", label: `Successful (${successCount})` },
            { id: "errors", label: `Errors (${errorCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-[#ffd600] text-black font-semibold"
                  : "bg-[#1b2013] text-zinc-400 hover:text-white border border-[#2b341f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or status..."
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-[#1b2013] text-white border border-[#2b341f] rounded-lg focus:outline-none focus:border-[#ffd600] placeholder:text-zinc-500"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
                filteredLogs.map((log) => (
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
                        {log.ok ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>{log.status || 500}</span>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
