"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  RotateCw,
  Layers,
  FileCode2,
  Terminal,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { scheduleTemplates } from "@/lib/monitorsData";
import { DashboardPageSkeleton, TableSkeletonRows } from "@/components/DashboardSkeletons";

export default function DashboardMainPage() {
  const {
    monitors,
    logs,
    openCreateModal,
    promptDeleteMonitor,
    togglePause,
    triggerPing,
    activeFilter,
    setActiveFilter,
    isLoadingAuth,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState("schedules"); // "schedules" | "templates" | "logs" | "errors"
  const [naturalScheduleInput, setNaturalScheduleInput] = useState("");
  const [pingingId, setPingingId] = useState(null);
  const [countdowns, setCountdowns] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Infinite load: 12 per batch
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(12);
  }, [activeFilter, searchQuery]);

  // Live countdown timer for active monitors
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns((prev) => {
        const next = { ...prev };
        monitors.forEach((m) => {
          if (m.status === "active") {
            const current = next[m.id] !== undefined ? next[m.id] : m.intervalSeconds;
            if (current <= 1) {
              next[m.id] = m.intervalSeconds;
            } else {
              next[m.id] = current - 1;
            }
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [monitors]);

  const handleManualPing = (id) => {
    setPingingId(id);
    triggerPing(id);
    setTimeout(() => {
      setPingingId(null);
    }, 450);
  };

  const handleApplyNaturalLanguage = (e) => {
    e.preventDefault();
    if (!naturalScheduleInput.trim()) return;

    const lower = naturalScheduleInput.toLowerCase();
    let interval = "30s";
    let name = "Custom Scheduled Monitor";

    if (lower.includes("10 second") || lower.includes("10s")) {
      interval = "10s";
      name = "10s High-Frequency Ping";
    } else if (lower.includes("30 second") || lower.includes("30s")) {
      interval = "30s";
      name = "30s Standard Health Check";
    } else if (lower.includes("10 min") || lower.includes("10m")) {
      interval = "10m";
      name = "10-Minute Batch Processor";
    } else if (lower.includes("23:30") || lower.includes("daily") || lower.includes("day")) {
      interval = "24h";
      name = "Daily 23:30 Maintenance Cron";
    }

    openCreateModal({
      name,
      interval,
      url: "https://api.myservice.com/cron",
    });
    setNaturalScheduleInput("");
  };

  // Filter monitors based on user selection & search query
  const filteredMonitors = monitors.filter((m) => {
    if (activeFilter === "active" && m.status !== "active") return false;
    if (activeFilter === "paused" && m.status !== "paused") return false;
    if (activeFilter === "failing" && m.status !== "failing") return false;
    if (activeFilter === "10s" && m.interval !== "10s") return false;
    if (activeFilter === "30s" && m.interval !== "30s") return false;
    if (activeFilter === "10m" && m.interval !== "10m") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q) ||
        m.intervalLabel?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const errorLogs = logs.filter((l) => !l.ok || (l.status && l.status >= 400));
  const hasMore = visibleCount < filteredMonitors.length;

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setIsLoadingMore(false);
    }, 400);
  };

  if (isLoadingAuth) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#252c1a]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Schedules
            </h1>
            <button
              type="button"
              onClick={() => openCreateModal()}
              title="Add new schedule"
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-[#202616] transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 text-[#ffd600]" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Normalized production table with infinite pagination of 12 per load.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-[#1a1f12] p-1 rounded-lg border border-[#27301b] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("schedules")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "schedules"
                ? "bg-[#28311a] text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Schedule table</span>
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#1b2013] text-[#ffd600] font-mono">
              {monitors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "templates"
                ? "bg-[#28311a] text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Templates
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "logs"
                ? "bg-[#28311a] text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Live Logs</span>
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#1b2013] text-zinc-300 font-mono">
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "errors"
                ? "bg-rose-950/40 text-rose-300 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-rose-300"
            }`}
          >
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Errors</span>
            </span>
            {errorLogs.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                {errorLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Row & Search Bar */}
      {activeTab === "schedules" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: `All (${monitors.length})` },
              { id: "active", label: "Active" },
              { id: "10s", label: "10s High-Freq" },
              { id: "30s", label: "30s Standard" },
              { id: "10m", label: "10m Batchers" },
              { id: "failing", label: "Failing" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#ffd600] text-black font-semibold shadow-xs"
                    : "bg-[#1b2013] text-zinc-400 hover:text-white border border-[#2b341f]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by name or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] w-56 sm:w-64"
              />
            </div>
            <div className="text-xs text-zinc-400 font-mono whitespace-nowrap">
              <span>{filteredMonitors.length} total</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: NORMALIZED PRODUCTION TABLE WITH INFINITE SCROLL */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          {filteredMonitors.length === 0 ? (
            <div className="border-l-2 border-white pl-4 py-4 space-y-3 bg-[#171b10] rounded-r-lg p-4">
              <p className="text-base font-semibold text-white">
                No schedules found.
              </p>
              <p className="text-xs text-zinc-400">
                Start by creating a schedule below or clearing your filter.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="mt-2 px-4 py-2 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-md flex items-center gap-1.5 transition-all shadow hover:shadow-md cursor-pointer"
                >
                  <span>Create schedule</span>
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#12150c] text-zinc-400 font-mono border-b border-[#242b18]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Monitor / Endpoint</th>
                      <th className="py-3 px-4 font-semibold">Method</th>
                      <th className="py-3 px-4 font-semibold">Cadence</th>
                      <th className="py-3 px-4 font-semibold">Next Ping</th>
                      <th className="py-3 px-4 font-semibold">Last Code</th>
                      <th className="py-3 px-4 font-semibold">Latency</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202615]">
                    {filteredMonitors.slice(0, visibleCount).map((mon) => {
                      const countdown =
                        countdowns[mon.id] !== undefined
                          ? countdowns[mon.id]
                          : mon.intervalSeconds;

                      const isPinging = pingingId === mon.id;
                      const isActive = mon.status === "active";
                      const isFailing = mon.status === "failing";

                      return (
                        <tr
                          key={mon.id}
                          className="hover:bg-[#1f2516] transition-colors group"
                        >
                          {/* Status Badge (Zero dots, clean rectangular tag) */}
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

                          {/* Name & URL */}
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-semibold text-white truncate group-hover:text-[#ffd600] transition-colors">
                              {mon.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono truncate flex items-center gap-1.5 mt-0.5">
                              <span className="truncate">{mon.url}</span>
                              <a
                                href={mon.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 hover:text-[#ffd600] shrink-0"
                                title="Open URL in new tab"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>

                          {/* Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#272f1b] text-zinc-300 border border-[#384328]">
                              {mon.method}
                            </span>
                          </td>

                          {/* Cadence */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded border ${
                                mon.interval === "10s"
                                  ? "bg-[#ffd600]/15 text-[#ffd600] border-[#ffd600]/30 font-bold"
                                  : mon.interval === "10m"
                                  ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                  : "bg-[#222817] text-zinc-300 border-[#313b20]"
                              }`}
                            >
                              {mon.intervalLabel || mon.interval}
                            </span>
                          </td>

                          {/* Next Run Countdown */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-300">
                            {isActive ? (
                              <span className="text-zinc-200 font-bold">
                                in {countdown}s
                              </span>
                            ) : (
                              <span className="text-zinc-500">paused</span>
                            )}
                          </td>

                          {/* Last Response Code */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${
                                mon.lastStatus === 200
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {mon.lastStatus || 200}
                            </span>
                          </td>

                          {/* Latency */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-200 font-bold">
                            {mon.lastLatency || 28}ms
                          </td>

                          {/* Action Buttons with Spinners */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Manual Ping with Spinner */}
                              <button
                                type="button"
                                onClick={() => handleManualPing(mon.id)}
                                disabled={isPinging}
                                title="Ping Now (Manual Test)"
                                className="p-1.5 rounded-md bg-[#242b18] hover:bg-[#2f3820] text-zinc-300 hover:text-[#ffd600] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RotateCw
                                  className={`w-3.5 h-3.5 ${
                                    isPinging ? "animate-spin text-[#ffd600]" : ""
                                  }`}
                                />
                              </button>

                              {/* Pause / Resume */}
                              <button
                                type="button"
                                onClick={() => togglePause(mon.id)}
                                title={isActive ? "Pause schedule" : "Resume schedule"}
                                className="p-1.5 rounded-md bg-[#242b18] hover:bg-[#2f3820] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              >
                                {isActive ? (
                                  <Pause className="w-3.5 h-3.5 text-zinc-400" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </button>

                              {/* Delete Monitor */}
                              <button
                                type="button"
                                onClick={() => promptDeleteMonitor(mon)}
                                title="Delete monitor"
                                className="p-1.5 rounded-md bg-[#242b18] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Skeletons while loading next 12 batch */}
                    {isLoadingMore && (
                      <TableSkeletonRows
                        rows={Math.min(12, Math.max(1, filteredMonitors.length - visibleCount))}
                      />
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer: Infinite Load Trigger & Count Status */}
              <div className="p-4 border-t border-[#242b18] bg-[#14170e] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-zinc-400 font-mono">
                  Showing <strong className="text-white">{Math.min(visibleCount, filteredMonitors.length)}</strong> of <strong className="text-white">{filteredMonitors.length}</strong> monitors
                </span>

                {hasMore ? (
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                    className="px-4 py-2 bg-[#1e2414] hover:bg-[#28311a] text-[#ffd600] border border-[#2d371d] font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading next 12 monitors...</span>
                      </>
                    ) : (
                      <>
                        <span>Load next 12 monitors</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          (+{Math.min(12, filteredMonitors.length - visibleCount)} remaining)
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500 font-mono">
                    All {filteredMonitors.length} monitors loaded
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Schedule Input Bar */}
          <div className="p-4 rounded-xl bg-[#181c12] border border-[#252c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-300">
              <strong className="text-white font-semibold block">Quick Natural Language Scheduler</strong>
              <span className="text-zinc-500">e.g. &quot;every 10 seconds&quot; or &quot;every 10 minutes&quot;</span>
            </div>
            <form onSubmit={handleApplyNaturalLanguage} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={naturalScheduleInput}
                onChange={(e) => setNaturalScheduleInput(e.target.value)}
                placeholder="every 10s, every 10m..."
                className="px-3.5 py-1.5 text-xs bg-[#12150c] text-white border border-[#2c371d] rounded-lg focus:outline-none focus:border-[#ffd600] placeholder:text-zinc-600 flex-1 sm:w-64"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduleTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() =>
                  openCreateModal({
                    name: tpl.title,
                    url: tpl.defaultUrl,
                    interval: tpl.interval,
                    method: tpl.method,
                  })
                }
                className="bg-[#181c12] border border-[#273019] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-[#ffd600] block">
                    {tpl.intervalLabel}
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222816] flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px] text-zinc-500">{tpl.method}</span>
                  <span className="text-[#ffd600] font-semibold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE LOGS */}
      {activeTab === "logs" && (
        <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[#242b18] flex items-center justify-between bg-[#12150c]">
            <h2 className="text-sm font-bold text-white">Live Dispatched Logs</h2>
            <span className="text-xs text-zinc-400 font-mono">{logs.length} logged runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#14170e] text-zinc-400 font-mono border-b border-[#242b18]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Monitor</th>
                  <th className="py-2.5 px-4 font-semibold">Method</th>
                  <th className="py-2.5 px-4 font-semibold">Latency</th>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202615]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1f2516] transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          log.ok
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {log.status || 200}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.monitorName}</div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate max-w-sm">{log.url}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{log.method}</td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-200">{log.latency}ms</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ERRORS */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          {errorLogs.length === 0 ? (
            <div className="p-8 text-center bg-[#181c12] border border-[#273019] rounded-xl text-xs text-zinc-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">All Monitors Operational</div>
              <p>No 4xx or 5xx HTTP failures recorded in the scheduler.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-500/30 bg-[#181c12] overflow-hidden">
              <div className="p-4 border-b border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
                <span className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Recorded Outages & Failure Traces</span>
                </span>
                <span className="text-xs font-mono text-rose-300 font-bold">{errorLogs.length} failures</span>
              </div>
              <div className="divide-y divide-[#242b18]">
                {errorLogs.map((err) => (
                  <div key={err.id} className="p-4 space-y-2 hover:bg-rose-950/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">{err.monitorName}</div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {err.status} {err.statusText}
                      </span>
                    </div>
                    <code className="text-[11px] text-zinc-400 font-mono block">{err.url}</code>
                    {err.error && (
                      <div className="p-2.5 rounded bg-[#10130a] border border-rose-900/40 text-[11px] font-mono text-rose-300">
                        {err.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
