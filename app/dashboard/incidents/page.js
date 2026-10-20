"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCw,
  Bell,
  Radio,
  FileText,
  Search,
  Check,
  X,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { TableSkeletonRows, MetricCardsSkeleton } from "@/components/DashboardSkeletons";

const initialIncidents = [
  {
    id: "inc-101",
    title: "Postgres Connection Pool Exhaustion on Legacy Reporting Service",
    service: "Legacy Reporting Service",
    url: "https://reports.legacy-service.internal/status",
    severity: "P2 - High",
    status: "investigating",
    startedAt: "25 minutes ago",
    duration: "Ongoing (25m)",
    cause: "Exceeded max_connections limit of 100 during monthly aggregation.",
    dispatchedTo: ["PagerDuty (DevOps OnCall)", "Slack #ops-alarms"],
  },
  {
    id: "inc-100",
    title: "Stripe Webhook Gateway 504 Gateway Timeout",
    service: "Production API Health Ping",
    url: "https://api.openboy.dev/v1/health",
    severity: "P1 - Critical",
    status: "resolved",
    startedAt: "3 days ago",
    duration: "4m 12s",
    cause: "Network route flap between us-east-1 and Stripe edge ingest point.",
    dispatchedTo: ["PagerDuty (Critical Escalation)", "SMS Lead Architect"],
    resolvedAt: "3 days ago at 14:18 UTC",
  },
  {
    id: "inc-99",
    title: "SSL Handshake Latency Degradation (>2500ms)",
    service: "High-Frequency Gateway Heartbeat",
    url: "https://gateway.openboy.dev/ping",
    severity: "P3 - Moderate",
    status: "resolved",
    startedAt: "12 days ago",
    duration: "18m 45s",
    cause: "OCSP stapling server timeout during TLS session renegotiation.",
    dispatchedTo: ["Slack #ops-alarms"],
    resolvedAt: "12 days ago at 09:40 UTC",
  },
  {
    id: "inc-98",
    title: "Kafka Event Ingest Buffer Saturation",
    service: "Analytics Event Ingestion Batcher",
    url: "https://worker.openboy.dev/batch/events",
    severity: "P2 - High",
    status: "resolved",
    startedAt: "15 days ago",
    duration: "8m 10s",
    cause: "Disk I/O throttle on primary ClickHouse buffer disk volume.",
    dispatchedTo: ["PagerDuty (DevOps)"],
    resolvedAt: "15 days ago at 22:15 UTC",
  },
  {
    id: "inc-97",
    title: "Redis Cluster Failover Event",
    service: "Realtime WebSocket Ingestion Node",
    url: "https://ws-edge.openboy.dev/healthz",
    severity: "P2 - High",
    status: "resolved",
    startedAt: "18 days ago",
    duration: "2m 30s",
    cause: "Leader replica crashed due to OOM memory spike; sentinel promoted slave.",
    dispatchedTo: ["Slack #ops-alarms", "PagerDuty"],
    resolvedAt: "18 days ago at 03:22 UTC",
  },
  {
    id: "inc-96",
    title: "Elasticsearch JVM Garbage Collection Pause (>15s)",
    service: "Elasticsearch Index Rolling Optimizer",
    url: "https://es.internal/_ilm/status",
    severity: "P3 - Moderate",
    status: "resolved",
    startedAt: "21 days ago",
    duration: "12m 04s",
    cause: "Heap fragmentation under bursty indexing load.",
    dispatchedTo: ["Slack #ops-alarms"],
    resolvedAt: "21 days ago at 11:05 UTC",
  },
  {
    id: "inc-95",
    title: "AWS SQS Inflight Dead-Letter Spillover",
    service: "Customer Webhook DLQ Replayer",
    url: "https://webhooks.openboy.dev/dlq/replay",
    severity: "P2 - High",
    status: "resolved",
    startedAt: "24 days ago",
    duration: "6m 50s",
    cause: "Customer destination HTTP endpoint returned repeated 502 Bad Gateway.",
    dispatchedTo: ["PagerDuty (Webhooks)"],
    resolvedAt: "24 days ago at 16:40 UTC",
  },
  {
    id: "inc-94",
    title: "DNS Query NXDOMAIN Intermittent Spike",
    service: "Internal DNS Resolver Prober",
    url: "https://dns.internal/healthcheck",
    severity: "P1 - Critical",
    status: "resolved",
    startedAt: "28 days ago",
    duration: "3m 44s",
    cause: "CoreDNS pod restart during rolling node group upgrade.",
    dispatchedTo: ["PagerDuty (Core Infra)", "Slack #critical"],
    resolvedAt: "28 days ago at 08:14 UTC",
  },
  {
    id: "inc-93",
    title: "Vault Token Lease Expiration Lockout",
    service: "Vault Secrets Auto-Rotation Prober",
    url: "https://vault.internal/v1/sys/health",
    severity: "P1 - Critical",
    status: "resolved",
    startedAt: "30 days ago",
    duration: "5m 12s",
    cause: "AppRole token renewal daemon encountered rate limit.",
    dispatchedTo: ["PagerDuty (Security)"],
    resolvedAt: "30 days ago at 19:33 UTC",
  },
  {
    id: "inc-92",
    title: "Segment Buffer Ingestion Backpressure",
    service: "Segment Telemetry Buffer Flush",
    url: "https://analytics.internal/buffer/flush",
    severity: "P3 - Moderate",
    status: "resolved",
    startedAt: "34 days ago",
    duration: "14m 20s",
    cause: "Downstream API rate limiting incoming batch bursts.",
    dispatchedTo: ["Slack #ops-alarms"],
    resolvedAt: "34 days ago at 13:00 UTC",
  },
  {
    id: "inc-91",
    title: "Cloudflare Edge SSL Handshake Mismatch",
    service: "Cloudflare DNS Record Health Verifier",
    url: "https://dns-check.internal/verify/apex",
    severity: "P2 - High",
    status: "resolved",
    startedAt: "38 days ago",
    duration: "7m 15s",
    cause: "Origin CA certificate expiration before auto-renewal completed.",
    dispatchedTo: ["PagerDuty (DevOps)"],
    resolvedAt: "38 days ago at 04:50 UTC",
  },
  {
    id: "inc-90",
    title: "Twilio Outbound SMS Gateway 429 Throttle",
    service: "Twilio SMS Fallback Gateway",
    url: "https://sms-gateway.openboy.dev/health",
    severity: "P3 - Moderate",
    status: "resolved",
    startedAt: "42 days ago",
    duration: "9m 02s",
    cause: "Exceeded short-code TPS limit during OTP authentication wave.",
    dispatchedTo: ["Slack #ops-alarms"],
    resolvedAt: "42 days ago at 17:10 UTC",
  },
  {
    id: "inc-89",
    title: "Kubernetes Kubelet Node Disk Pressure",
    service: "Kubernetes Node Health Heartbeat",
    url: "https://k8s-apiserver.internal/livez",
    severity: "P2 - High",
    status: "resolved",
    startedAt: "45 days ago",
    duration: "11m 30s",
    cause: "Docker root directory unpruned images filled ephemeral storage.",
    dispatchedTo: ["PagerDuty (DevOps)"],
    resolvedAt: "45 days ago at 02:45 UTC",
  },
  {
    id: "inc-88",
    title: "PostgreSQL Replica Read-Only Query Timeout",
    service: "PostgreSQL Replica Lag Monitor",
    url: "https://db-monitor.internal/pg-replica-status",
    severity: "P3 - Moderate",
    status: "resolved",
    startedAt: "48 days ago",
    duration: "16m 00s",
    cause: "Long-running analytics report blocked vacuum process.",
    dispatchedTo: ["Slack #ops-alarms"],
    resolvedAt: "48 days ago at 06:12 UTC",
  },
];

export default function IncidentsPage() {
  const { monitors, logs, triggerPing, isLoadingAuth } = useDashboard();
  const [incidents, setIncidents] = useState(initialIncidents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === "p1" && !inc.severity.includes("P1")) return false;
    if (filterSeverity === "p2" && !inc.severity.includes("P2")) return false;
    if (filterSeverity === "p3" && !inc.severity.includes("P3")) return false;
    if (filterSeverity === "ongoing" && inc.status !== "investigating") return false;
    if (filterSeverity === "resolved" && inc.status !== "resolved") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.cause.toLowerCase().includes(q) ||
        inc.severity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Infinite load: 12 per batch (Automatic on scroll)
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  const hasMore = visibleCount < filteredIncidents.length;

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(12);
  }, [filterSeverity, searchQuery]);

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
      { rootMargin: "300px" }
    );

    const sentinel = loadSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, isLoadingMore]);

  const promptResolve = (incident) => {
    setResolveModal({ isOpen: true, incident });
  };

  const confirmResolve = () => {
    if (resolveModal.incident) {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === resolveModal.incident.id
            ? {
                ...inc,
                status: "resolved",
                resolvedAt: "Just now",
                duration: "Resolved in 26m",
              }
            : inc
        )
      );
    }
    setResolveModal({ isOpen: false, incident: null });
  };

  const promptDelete = (incident) => {
    setDeleteModal({ isOpen: true, incident });
  };

  const confirmDelete = () => {
    if (deleteModal.incident) {
      setIncidents((prev) => prev.filter((i) => i.id !== deleteModal.incident.id));
    }
    setDeleteModal({ isOpen: false, incident: null });
  };

  const runDiagnostics = (monitorId) => {
    triggerPing(monitorId);
  };

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#28321b] rounded animate-pulse"></div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-[#181c12] rounded-xl border border-[#273019] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (No icon next to title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242b18]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Incidents & Downtime Alarms
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Normalized production table of downtime alarms, MTTR telemetry, and root-cause post-mortems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191d11] border border-[#273019] text-xs font-mono text-zinc-400">
            <span>Escalation Engine: Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Row (Phone responsive 2x2 grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {incidents.filter((i) => i.status === "investigating").length + activeFailingMonitors.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Requires engineer triage</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Mean Time to Recover (MTTR)</span>
            <Clock className="w-4 h-4 text-[#ffd600]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">4m 12s</div>
          <div className="text-[11px] text-emerald-400 mt-1">Past 30 days average</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Overall Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">99.94%</div>
          <div className="text-[11px] text-zinc-500 mt-1">Across all cron endpoints</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Alert Destinations</span>
            <Bell className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">PagerDuty / Slack</div>
          <div className="text-[11px] text-zinc-500 mt-1">Auto-escalation enabled</div>
        </div>
      </div>

      {/* Active Outage Warning if failing monitors exist */}
      {activeFailingMonitors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Active Outages Detected in Scheduler</h3>
                <p className="text-xs text-zinc-400">{activeFailingMonitors.length} monitor endpoints are currently failing health checks.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activeFailingMonitors.map((mon) => (
              <div key={mon.id} className="p-3 bg-black/40 border border-rose-900/40 rounded-lg flex items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <div className="text-white font-bold">{mon.name}</div>
                  <div className="text-rose-400 text-[11px]">{mon.url} (Code: {mon.lastStatus || 503})</div>
                </div>
                <button
                  type="button"
                  onClick={() => runDiagnostics(mon.id)}
                  className="px-3 py-1.5 rounded bg-[#ffd600] text-black font-bold text-xs shrink-0 cursor-pointer"
                >
                  Diagnose
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Row & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242b18] pb-3">
        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-zinc-300 focus:outline-none focus:border-[#ffd600]"
          >
            <option value="all">All Severities</option>
            <option value="p1">P1 - Critical</option>
            <option value="p2">P2 - High</option>
            <option value="p3">P3 - Moderate</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search incident records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] w-64"
          />
        </div>
      </div>

      {/* NORMALIZED HIGH-DENSITY INCIDENTS TABLE WITH INFINITE SCROLL */}
      <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead className="bg-[#12150c] text-zinc-400 font-mono border-b border-[#242b18]">
              <tr>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Incident / Affected Service</th>
                <th className="py-3 px-4 font-semibold">Root Cause Trace</th>
                <th className="py-3 px-4 font-semibold">Started</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Notified</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202615]">
              {filteredIncidents.slice(0, visibleCount).map((inc) => {
                const isOngoing = inc.status === "investigating";

                return (
                  <tr
                    key={inc.id}
                    className="hover:bg-[#1f2516] transition-colors group"
                  >
                    {/* Severity Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          inc.severity.includes("P1")
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : inc.severity.includes("P2")
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        }`}
                      >
                        {inc.severity.split(" - ")[0]}
                      </span>
                    </td>

                    {/* Status Badge (Zero dots, clean rectangular tag) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isOngoing
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isOngoing ? "Ongoing" : "Resolved"}
                      </span>
                    </td>

                    {/* Incident Title & Service */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-white truncate group-hover:text-[#ffd600] transition-colors">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                        {inc.service}
                      </div>
                    </td>

                    {/* Root Cause */}
                    <td className="py-3.5 px-4 max-w-xs text-zinc-300 font-mono text-[11px] truncate">
                      {inc.cause}
                    </td>

                    {/* Started */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-400">
                      {inc.startedAt}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-white font-bold">
                      {inc.duration}
                    </td>

                    {/* Notified */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-400 text-[10px]">
                      {inc.dispatchedTo.map((d) => d.split(" ")[0]).join(", ")}
                    </td>

                    {/* Action Buttons with Spinners */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isOngoing && (
                          <button
                            type="button"
                            onClick={() => promptResolve(inc)}
                            className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Resolve</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => promptDelete(inc)}
                          className="p-1.5 rounded-md bg-[#212716] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-[#2e371f] transition-colors cursor-pointer"
                          title="Delete Incident Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Skeletons while loading more */}
              {isLoadingMore && (
                <TableSkeletonRows
                  rows={Math.min(12, Math.max(1, filteredIncidents.length - visibleCount))}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Invisible sentinel for automatic infinite scroll */}
        {hasMore && <div ref={loadSentinelRef} className="h-4 w-full pointer-events-none" />}
      </div>

      {/* Mark Resolved Modal */}
      {resolveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181c12] border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Resolve Incident</h3>
                <p className="text-xs text-zinc-400">{resolveModal.incident?.service}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Confirm that the root cause has been addressed and all automated health checks are passing. This will log the resolution timestamp and notify on-call engineers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResolveModal({ isOpen: false, incident: null })}
                className="px-4 py-2 rounded-lg border border-[#2b351e] bg-[#14170e] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResolve}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incident Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181c12] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Incident Record</h3>
                <p className="text-xs text-zinc-400">{deleteModal.incident?.title}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete this incident post-mortem? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, incident: null })}
                className="px-4 py-2 rounded-lg border border-[#2b351e] bg-[#14170e] text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
