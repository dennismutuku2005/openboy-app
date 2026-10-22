"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Clock,
  RotateCw,
  History,
  CheckCircle2,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { DashboardPageSkeleton } from "@/components/DashboardSkeletons";
import SearchInput from "@/components/SearchInput";
import FilterTabs from "@/components/FilterTabs";
import StatusBadge from "@/components/StatusBadge";
import IntervalBadge from "@/components/IntervalBadge";
import MethodBadge from "@/components/MethodBadge";
import EmptyState from "@/components/EmptyState";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

const scheduleTemplates = [
  {
    id: "tpl-1",
    title: "High-frequency Health Ping (Every 10s)",
    description: "Ping critical microservices at the minimum 10-second interval to catch outages instantly.",
    interval: "10s",
    intervalSeconds: 10,
    intervalLabel: "10s",
    method: "GET",
    defaultUrl: "https://api.example.com/health",
  },
  {
    id: "tpl-2",
    title: "Standard Monitor (Every 30 seconds)",
    description: "The recommended standard heartbeat interval for APIs, webhooks, and SaaS services.",
    interval: "30s",
    intervalSeconds: 30,
    intervalLabel: "30s",
    method: "GET",
    defaultUrl: "https://api.example.com/status",
  },
  {
    id: "tpl-3",
    title: "Background Batcher Trigger (Every 10 minutes)",
    description: "Trigger scheduled data pipelines, queue consumers, and sync jobs every 10 minutes.",
    interval: "10m",
    intervalSeconds: 600,
    intervalLabel: "10m",
    method: "POST",
    defaultUrl: "https://api.example.com/jobs/batch-process",
  },
  {
    id: "tpl-4",
    title: "Nightly Maintenance: Run at 23:30, every day",
    description: "Schedule daily backups, cleanup scripts, and aggregation tasks late at night.",
    interval: "custom",
    intervalSeconds: 86400,
    intervalLabel: "Daily 23:30",
    method: "POST",
    defaultUrl: "https://api.example.com/cron/nightly-backup",
  },
];

export default function DashboardMainPage() {
  const router = useRouter();
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
    return <DashboardPageSkeleton />;
  }

  const monitorFilters = [
    { id: "all", label: "All", count: monitors.length },
    { id: "active", label: "Active", count: monitors.filter((m) => m.status === "active").length },
    { id: "10s", label: "10s High-Freq", count: monitors.filter((m) => m.interval === "10s").length },
    { id: "30s", label: "30s Standard", count: monitors.filter((m) => m.interval === "30s").length },
    { id: "10m", label: "10m Batchers", count: monitors.filter((m) => m.interval === "10m").length },
    { id: "failing", label: "Failing", count: monitors.filter((m) => m.status === "failing").length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-openboy-border">
        <div>
          <h1 className="text-2xl font-bold text-openboy-text-main tracking-tight">
            Schedules
          </h1>
          <p className="text-xs text-openboy-text-muted mt-1">
            High-frequency cron schedules, real-time dispatchers, and health monitors.
          </p>
        </div>

        {/* Mobile View Dropdown */}
        <div className="md:hidden w-full">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-openboy-surface border border-openboy-border text-openboy-text-main text-xs rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:border-[#ffd600] cursor-pointer"
          >
            <option value="schedules">Schedule Table ({monitors.length})</option>
            <option value="templates">Templates ({scheduleTemplates.length})</option>
            <option value="logs">Live Logs ({logs.length})</option>
            <option value="errors">Errors ({errorLogs.length})</option>
          </select>
        </div>

        {/* Desktop View Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-openboy-surface-subtle p-1 rounded-lg border border-openboy-border">
          <button
            type="button"
            onClick={() => setActiveTab("schedules")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "schedules"
                ? "bg-[#ffd600] text-black font-bold shadow-xs"
                : "text-openboy-text-muted hover:text-openboy-text-main"
            }`}
          >
            <span>Schedule table</span>
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${
              activeTab === "schedules" ? "bg-black/15 text-black" : "bg-openboy-surface text-[#ffd600]"
            }`}>
              {monitors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "templates"
                ? "bg-[#ffd600] text-black font-bold shadow-xs"
                : "text-openboy-text-muted hover:text-openboy-text-main"
            }`}
          >
            Templates
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "logs"
                ? "bg-[#ffd600] text-black font-bold shadow-xs"
                : "text-openboy-text-muted hover:text-openboy-text-main"
            }`}
          >
            <span>Live Logs</span>
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${
              activeTab === "logs" ? "bg-black/15 text-black" : "bg-openboy-surface text-openboy-text-muted"
            }`}>
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "errors"
                ? "bg-rose-500/20 text-rose-500 dark:text-rose-300 font-bold border border-rose-500/30"
                : "text-openboy-text-muted hover:text-rose-500"
            }`}
          >
            <span>Errors</span>
            {errorLogs.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 dark:text-rose-300 font-mono font-bold">
                {errorLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Row & Search Bar */}
      {activeTab === "schedules" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <FilterTabs
            tabs={monitorFilters}
            activeTab={activeFilter}
            onChange={(tabId) => setActiveFilter(tabId)}
          />

          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or URL..."
              containerClassName="w-full md:w-64"
            />
            <div className="text-xs text-openboy-text-muted font-mono whitespace-nowrap hidden sm:block">
              <span>{filteredMonitors.length} total</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SCHEDULE TABLE WITH INFINITE SCROLL */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          {filteredMonitors.length === 0 ? (
            <EmptyState
              title="No schedules found"
              description="No monitors match your current filter criteria. Start by creating a new cron schedule or clearing your active filters."
              action={{
                label: "Create schedule",
                onClick: () => openCreateModal(),
                icon: Plus,
              }}
            />
          ) : (
            <div className="rounded-xl border border-openboy-border bg-openboy-surface overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                  <thead className="bg-openboy-surface-subtle text-openboy-text-muted font-mono border-b border-openboy-border">
                    <tr>
                      <th className="py-3 px-4 font-semibold w-[120px]">Status</th>
                      <th className="py-3 px-4 font-semibold min-w-[200px]">Monitor / Endpoint</th>
                      <th className="py-3 px-4 font-semibold w-[80px]">Method</th>
                      <th className="py-3 px-4 font-semibold w-[110px]">Cadence</th>
                      <th className="py-3 px-4 font-semibold w-[100px]">Next Ping</th>
                      <th className="py-3 px-4 font-semibold w-[90px]">Last Code</th>
                      <th className="py-3 px-4 font-semibold w-[85px]">Latency</th>
                      <th className="py-3 px-4 text-right font-semibold w-[95px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-openboy-border">
                    {filteredMonitors.slice(0, visibleCount).map((mon) => {
                      const countdown =
                        countdowns[mon.id] !== undefined
                          ? countdowns[mon.id]
                          : mon.intervalSeconds;

                      const isPinging = pingingId === mon.id;
                      const isActive = mon.status === "active";

                      return (
                        <tr
                          key={mon.id}
                          onClick={() => router.push(`/dashboard/executions?monitor=${mon.id}`)}
                          className="hover:bg-openboy-surface-hover transition-colors group cursor-pointer"
                          title="Click to view run history on executions page"
                        >
                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={mon.status} />
                          </td>

                          {/* Name & URL */}
                          <td className="py-3.5 px-4 max-w-sm">
                            <Link
                              href={`/dashboard/executions?monitor=${mon.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-openboy-text-main truncate group-hover:text-[#ffd600] transition-colors block"
                            >
                              {mon.name}
                            </Link>
                            <div className="text-[11px] text-openboy-text-muted font-mono truncate flex items-center gap-1.5 mt-0.5">
                              <span className="truncate">{mon.url}</span>
                              <a
                                href={mon.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-openboy-text-muted hover:text-[#ffd600] shrink-0"
                                title="Open URL in new tab"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>

                          {/* Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <MethodBadge method={mon.method} />
                          </td>

                          {/* Cadence */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <IntervalBadge interval={mon.interval} label={mon.intervalLabel || mon.interval} />
                          </td>

                          {/* Next Run Countdown */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-openboy-text-muted">
                            {isActive ? (
                              <span className="text-openboy-text-main font-bold">
                                in {countdown}s
                              </span>
                            ) : (
                              <span className="text-openboy-text-dim">paused</span>
                            )}
                          </td>

                          {/* Last Response Code */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                            <StatusBadge
                              status={mon.lastStatus || 200}
                              label={String(mon.lastStatus || 200)}
                            />
                          </td>

                          {/* Latency */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-openboy-text-main font-bold">
                            {mon.lastLatency || 28}ms
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Run History */}
                              <Link
                                href={`/dashboard/executions?monitor=${mon.id}`}
                                onClick={(e) => e.stopPropagation()}
                                title="View Execution History"
                                className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-[#ffd600] transition-colors inline-flex items-center justify-center cursor-pointer border border-openboy-border"
                              >
                                <History className="w-3.5 h-3.5" />
                              </Link>

                              {/* Manual Ping with Spinner */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualPing(mon.id);
                                }}
                                disabled={isPinging}
                                title="Ping Now (Manual Test)"
                                className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-[#ffd600] transition-colors cursor-pointer disabled:opacity-50 border border-openboy-border"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePause(mon.id);
                                }}
                                title={isActive ? "Pause schedule" : "Resume schedule"}
                                className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer border border-openboy-border"
                              >
                                {isActive ? (
                                  <Pause className="w-3.5 h-3.5 text-openboy-text-muted" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                              </button>

                              {/* Delete Monitor */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  promptDeleteMonitor(mon);
                                }}
                                title="Delete monitor"
                                className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-rose-500/15 text-openboy-text-muted hover:text-rose-500 transition-colors cursor-pointer border border-openboy-border"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
          )}
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
                className="bg-openboy-surface border border-openboy-border rounded-xl p-5 hover:border-[#ffd600]/80 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-[#ffd600] block">
                    {tpl.intervalLabel}
                  </span>
                  <h3 className="text-sm font-semibold text-openboy-text-main group-hover:text-[#ffd600] transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-openboy-text-muted leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-openboy-border flex items-center justify-between text-xs text-openboy-text-muted">
                  <MethodBadge method={tpl.method} />
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
        <div className="rounded-xl border border-openboy-border bg-openboy-surface overflow-hidden shadow-xs">
          <div className="p-4 border-b border-openboy-border flex items-center justify-between bg-openboy-surface-subtle">
            <h2 className="text-sm font-bold text-openboy-text-main">Live Dispatched Logs</h2>
            <span className="text-xs text-openboy-text-muted font-mono">{logs.length} logged runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-openboy-surface text-openboy-text-muted font-mono border-b border-openboy-border">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Monitor</th>
                  <th className="py-2.5 px-4 font-semibold">Method</th>
                  <th className="py-2.5 px-4 font-semibold">Latency</th>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-openboy-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-openboy-surface-hover transition-colors">
                    <td className="py-3 px-4">
                      <StatusBadge status={log.ok ? 200 : log.status || 500} label={String(log.status || 200)} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-openboy-text-main">{log.monitorName}</div>
                      <div className="text-[11px] text-openboy-text-muted font-mono truncate max-w-sm">{log.url}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <MethodBadge method={log.method} />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-openboy-text-main">{log.latency}ms</td>
                    <td className="py-3 px-4 text-openboy-text-muted font-mono">{log.timestamp}</td>
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
            <div className="p-8 text-center bg-openboy-surface border border-openboy-border rounded-xl text-xs text-openboy-text-muted space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-openboy-text-main">All Monitors Operational</div>
              <p>No 4xx or 5xx HTTP failures recorded in the scheduler.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-500/30 bg-openboy-surface overflow-hidden">
              <div className="p-4 border-b border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
                <span className="text-sm font-bold text-rose-500 dark:text-rose-300">
                  Recorded Outages & Failure Traces
                </span>
                <span className="text-xs font-mono text-rose-500 dark:text-rose-300 font-bold">{errorLogs.length} failures</span>
              </div>
              <div className="divide-y divide-openboy-border">
                {errorLogs.map((err) => (
                  <div key={err.id} className="p-4 space-y-2 hover:bg-rose-500/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-openboy-text-main text-xs">{err.monitorName}</div>
                      <StatusBadge status={err.status} label={`${err.status} ${err.statusText}`} />
                    </div>
                    <code className="text-[11px] text-openboy-text-muted font-mono block">{err.url}</code>
                    {err.error && (
                      <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] font-mono text-rose-600 dark:text-rose-300">
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
