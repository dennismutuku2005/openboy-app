"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { scheduleTemplates } from "@/lib/monitorsData";
import { DashboardPageSkeleton } from "@/components/DashboardSkeletons";

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

  // Filter monitors based on user selection
  const filteredMonitors = monitors.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return m.status === "active";
    if (activeFilter === "paused") return m.status === "paused";
    if (activeFilter === "failing") return m.status === "failing";
    if (activeFilter === "10s") return m.interval === "10s";
    if (activeFilter === "30s") return m.interval === "30s";
    if (activeFilter === "10m") return m.interval === "10m";
    return true;
  });

  const errorLogs = logs.filter((l) => !l.ok || (l.status && l.status >= 400));

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
            High-frequency monitors, batch workers, and automated API health telemetry.
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
            <span>Schedule list</span>
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

      {/* Filter Pills */}
      {activeTab === "schedules" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="text-xs text-zinc-400 font-mono">
            Filtered: <span className="text-white font-semibold">{filteredMonitors.length}</span> / {monitors.length}
          </div>
        </div>
      )}

      {/* TAB 1: SCHEDULE LIST */}
      {activeTab === "schedules" && (
        <div className="space-y-6">
          {filteredMonitors.length === 0 ? (
            /* Empty state matching Image 2 */
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
            /* List of monitors */
            <div className="space-y-3">
              {filteredMonitors.map((mon) => {
                const countdown =
                  countdowns[mon.id] !== undefined
                    ? countdowns[mon.id]
                    : mon.intervalSeconds;

                const is10s = mon.interval === "10s";
                const is30s = mon.interval === "30s";
                const is10m = mon.interval === "10m";

                return (
                  <div
                    key={mon.id}
                    className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 sm:p-5 hover:border-[#3d492c] transition-all group shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Monitor Name & URL */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Live Status badge (Clean text badge, zero dot) */}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              mon.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : mon.status === "failing"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                : "bg-[#252c19] text-zinc-400 border-[#384328]"
                            }`}
                          >
                            {mon.status === "active"
                              ? "Active"
                              : mon.status === "failing"
                              ? "Failing"
                              : "Paused"}
                          </span>

                          <h3 className="text-sm font-semibold text-white truncate">
                            {mon.name}
                          </h3>

                          {/* Method badge */}
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#272f1b] text-zinc-300 border border-[#384328]">
                            {mon.method}
                          </span>

                          {/* Interval badge */}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                              is10s
                                ? "bg-[#ffd600]/20 text-[#ffd600] border border-[#ffd600]/40 font-mono"
                                : is30s
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono"
                                : is10m
                                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono"
                                : "bg-[#272f1b] text-zinc-300 font-mono"
                            }`}
                          >
                            {is10s && <Zap className="w-3 h-3 text-[#ffd600]" />}
                            <span>{mon.intervalLabel}</span>
                          </span>
                        </div>

                        {/* URL */}
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono truncate">
                          <span className="truncate">{mon.url}</span>
                          <a
                            href={mon.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-300 shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap">
                        {/* Live Countdown */}
                        {mon.status === "active" ? (
                          <div className="text-right">
                            <span className="text-xs text-zinc-400 font-medium block">
                              Next Ping
                            </span>
                            <span className="text-xs font-mono font-semibold text-[#ffd600]">
                              in {countdown}s
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs text-zinc-400 font-medium block">
                              Status
                            </span>
                            <span className="text-xs font-medium text-zinc-400">
                              Paused
                            </span>
                          </div>
                        )}

                        {/* Latency */}
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 font-medium block">
                            Latency
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              mon.lastLatency > 1000
                                ? "text-rose-400"
                                : mon.lastLatency > 300
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {mon.lastLatency}ms
                          </span>
                        </div>

                        {/* Last Code */}
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 font-medium block">
                            Last Code
                          </span>
                          <span
                            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                              mon.lastStatus === 200
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {mon.lastStatus || "---"}
                          </span>
                        </div>

                        {/* Uptime */}
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-zinc-400 font-medium block">
                            Uptime
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {mon.uptime || "100%"}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-[#2e3720]">
                          {/* Ping Now */}
                          <button
                            type="button"
                            onClick={() => handleManualPing(mon.id)}
                            disabled={pingingId === mon.id}
                            title="Ping Now (Manual Test)"
                            className="p-1.5 rounded-md bg-[#242b18] hover:bg-[#2f3820] text-zinc-300 hover:text-[#ffd600] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${
                                pingingId === mon.id ? "animate-spin text-[#ffd600]" : ""
                              }`}
                            />
                          </button>

                          {/* Pause / Resume */}
                          <button
                            type="button"
                            onClick={() => togglePause(mon.id)}
                            title={mon.status === "active" ? "Pause schedule" : "Resume schedule"}
                            className="p-1.5 rounded-md bg-[#242b18] hover:bg-[#2f3820] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {mon.status === "active" ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          {/* Delete with custom confirmation modal */}
                          <button
                            type="button"
                            onClick={() => promptDeleteMonitor(mon)}
                            title="Delete monitor"
                            className="p-1.5 rounded-md bg-[#242b18] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Schedule Templates Grid matching Image 2 */}
          <div className="pt-8 border-t border-[#252c1a] space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Schedule Templates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Interactive Card 1: "Describe your schedule" matching Image 2 */}
              <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 flex flex-col justify-between hover:border-[#3f4d2d] transition-colors">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    Describe your schedule
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tell us when it should run and we&apos;ll create the cron schedule.
                  </p>
                </div>

                <form onSubmit={handleApplyNaturalLanguage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={naturalScheduleInput}
                    onChange={(e) => setNaturalScheduleInput(e.target.value)}
                    placeholder="e.g. every 10 seconds or every 10 minutes"
                    className="flex-1 px-3 py-1.5 text-xs bg-[#242a18] text-white border border-[#353e24] rounded focus:outline-none focus:border-[#ffd600] placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded transition-colors cursor-pointer"
                  >
                    Create
                  </button>
                </form>
              </div>

              {/* Card 2: "Run a schedule at At 23:30, every day" from Image 2 */}
              <div
                onClick={() =>
                  openCreateModal({
                    name: "Nightly Cron Run (23:30)",
                    url: "https://api.example.com/nightly-sync",
                    interval: "24h",
                    method: "POST",
                  })
                }
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#ffd600] block">
                    Daily Cron
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    Run a schedule at At 23:30, every day
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Daily cleanup, aggregation, and backup triggers executed at 23:30 UTC.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px]">30 23 * * *</span>
                  <span className="text-[#ffd600] font-semibold group-hover:translate-x-1 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>

              {/* Card 3: "Run a schedule at At 00:00, on day 1 and 15..." from Image 2 */}
              <div
                onClick={() =>
                  openCreateModal({
                    name: "Bi-monthly & Monday Cron",
                    url: "https://api.example.com/bi-monthly-job",
                    interval: "custom",
                    method: "POST",
                  })
                }
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-400 block">
                    Multi-day Schedule
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    Run a schedule at At 00:00, on day 1 and 15 of the month, and on Monday
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Complex payroll calculations and bi-monthly ledger balance checks.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px]">0 0 1,15 * 1</span>
                  <span className="text-[#ffd600] font-semibold group-hover:translate-x-1 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>

              {/* Card 4: Standard 30 Seconds Monitor */}
              <div
                onClick={() =>
                  openCreateModal({
                    name: "API Health Check (30s)",
                    url: "https://api.example.com/health",
                    interval: "30s",
                    method: "GET",
                  })
                }
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-amber-400 block">
                    Standard Default
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    Ping every 30 seconds
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Standard heartbeat cadence to verify latency and service uptime.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px]">30s interval</span>
                  <span className="text-[#ffd600] font-semibold group-hover:translate-x-1 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>

              {/* Card 5: High-Frequency 10 Seconds Monitor */}
              <div
                onClick={() =>
                  openCreateModal({
                    name: "Zero-Downtime Ping (10s)",
                    url: "https://api.example.com/v1/ping",
                    interval: "10s",
                    method: "GET",
                  })
                }
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#ffd600] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#ffd600]" />
                    High Frequency (Least 10s)
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    High-speed ping every 10 seconds
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Instant outage detection for mission-critical internal APIs and gateways.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px]">10s interval</span>
                  <span className="text-[#ffd600] font-semibold group-hover:translate-x-1 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>

              {/* Card 6: 10-Minute Batcher Worker */}
              <div
                onClick={() =>
                  openCreateModal({
                    name: "Queue Consumer Batcher (10m)",
                    url: "https://worker.example.com/batch/consume",
                    interval: "10m",
                    method: "POST",
                  })
                }
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600]/60 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-sky-400 block">
                    Batch Worker Trigger
                  </span>
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#ffd600] transition-colors">
                    Trigger batcher every 10 minutes
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Wake up batch processing workers to ingest analytics, clear caches, or flush queues.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px]">*/10 * * * *</span>
                  <span className="text-[#ffd600] font-semibold group-hover:translate-x-1 transition-transform">
                    Use template &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES FULL VIEW */}
      {activeTab === "templates" && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Pre-configured Cron Templates</h2>
            <p className="text-xs text-zinc-400">
              Select any interval or cron recipe to instantly launch your monitor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 hover:border-[#ffd600] transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#242a18] text-[#ffd600]">
                    {tpl.intervalLabel}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 font-bold">
                    {tpl.method}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#ffd600] transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-xs text-zinc-400">{tpl.description}</p>
                <div className="pt-2 text-xs text-[#ffd600] font-medium flex items-center gap-1">
                  Deploy this schedule &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTION LOGS STREAM */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Execution Logs Stream</h2>
              <p className="text-xs text-zinc-400">
                Real-time recording of all cron pings, HTTP response codes, and latencies.
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Showing {logs.length} runs
            </span>
          </div>

          <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#212717] text-zinc-300 text-xs font-semibold border-b border-[#2b341f]">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Monitor / URL</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252d1b]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#202616] transition-colors">
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
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
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
                          <span className="text-rose-400 text-[11px] font-mono">
                            {log.error}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Success (200 OK)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ERROR MONITOR */}
      {activeTab === "errors" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Failed Executions & Error Monitor</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Investigate failing endpoints, timeout thresholds, and HTTP 5xx responses.
              </p>
            </div>
          </div>

          {errorLogs.length === 0 ? (
            <div className="p-8 bg-[#1b2013] border border-[#2b341f] rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white">All systems operational!</h3>
              <p className="text-xs text-zinc-400">
                No failed pings or errors detected in the current session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {errorLogs.map((err) => (
                <div
                  key={err.id}
                  className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono font-bold text-rose-300">
                      <span className="px-2 py-0.5 rounded bg-rose-900/40 border border-rose-800/60">
                        HTTP {err.status}
                      </span>
                      <span>{err.monitorName}</span>
                    </div>
                    <span className="text-zinc-400">{err.timestamp}</span>
                  </div>

                  <div className="font-mono text-zinc-300 break-all">
                    Endpoint: {err.url} ({err.method}) - Latency: {err.latency}ms
                  </div>

                  {err.error && (
                    <div className="p-2.5 bg-[#14170e] border border-rose-900/30 rounded font-mono text-[11px] text-rose-400">
                      Trace: {err.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
