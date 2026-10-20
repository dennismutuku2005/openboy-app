"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";

const pastIncidents = [
  {
    id: "inc-101",
    title: "Postgres Connection Pool Exhaustion on Legacy Reporting Service",
    service: "Legacy Reporting Service",
    url: "https://reports.legacy-service.internal/status",
    severity: "P2 - High",
    status: "investigating",
    startedAt: "25 minutes ago",
    duration: "Ongoing (25m)",
    cause: "Exceeded max_connections limit of 100 during heavy monthly aggregation.",
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
];

export default function IncidentsPage() {
  const { monitors, logs, triggerPing } = useDashboard();
  const [incidents, setIncidents] = useState(pastIncidents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // Custom modals
  const [resolveModal, setResolveModal] = useState({ isOpen: false, incident: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, incident: null });
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  const activeFailingMonitors = monitors.filter((m) => m.status === "failing");

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== "all" && !inc.severity.toLowerCase().includes(filterSeverity)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.cause.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
    setDiagnosticsRunning(true);
    triggerPing(monitorId);
    setTimeout(() => {
      setDiagnosticsRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242b18]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>Incidents & Downtime Alarms</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time failure escalations, service outages, and post-mortem logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191d11] border border-[#273019] text-xs font-mono text-zinc-400">
            <span>Escalation Engine: Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Active Outage Banner if failing monitors exist */}
      {activeFailingMonitors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Active Outages Detected in Scheduler
            </h2>
          </div>

          {activeFailingMonitors.map((mon) => (
            <div
              key={mon.id}
              className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{mon.name}</h3>
                    <code className="text-xs text-rose-300 font-mono">{mon.url}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => runDiagnostics(mon.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Run Live Check</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-rose-900/40 text-xs font-mono text-zinc-300 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-zinc-500">Last Code: </span>
                  <span className="text-rose-400 font-bold">{mon.lastStatus || 503}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Latency: </span>
                  <span className="text-rose-400 font-bold">{mon.lastLatency || 2840}ms</span>
                </div>
                <div>
                  <span className="text-zinc-500">Cron Cadence: </span>
                  <span className="text-zinc-300 font-bold">{mon.interval}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Post-Mortems and Audit Logs */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242b18] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-white">Incident Timeline & Post-Mortem Records</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600]"
              />
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-zinc-300 focus:outline-none focus:border-[#ffd600]"
            >
              <option value="all">All Severities</option>
              <option value="p1">P1 - Critical</option>
              <option value="p2">P2 - High</option>
              <option value="p3">P3 - Moderate</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const isOngoing = incident.status === "investigating";

            return (
              <div
                key={incident.id}
                className="p-5 rounded-xl bg-[#181c12] border border-[#273019] space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          incident.severity.includes("P1")
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : incident.severity.includes("P2")
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {incident.severity}
                      </span>

                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isOngoing
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {isOngoing ? "Investigating" : "Resolved"}
                      </span>

                      <span className="text-xs font-mono text-zinc-400">
                        {incident.startedAt}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white pt-1">
                      {incident.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOngoing && (
                      <button
                        type="button"
                        onClick={() => promptResolve(incident)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => promptDelete(incident)}
                      className="p-2 rounded-lg bg-[#212716] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-[#2e371f] transition-colors cursor-pointer"
                      title="Delete Incident Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cause and details */}
                <div className="p-3.5 rounded-lg bg-[#12150c] border border-[#222816] text-xs space-y-1.5">
                  <div className="text-zinc-400">
                    <span className="text-zinc-500 font-semibold">Root Cause: </span>
                    <span className="text-zinc-200">{incident.cause}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap pt-1">
                    <span>Impact Duration: <strong className="text-white">{incident.duration}</strong></span>
                    <span>Service: <strong className="text-[#ffd600]">{incident.service}</strong></span>
                    {incident.resolvedAt && (
                      <span className="text-emerald-400 font-bold">Resolved: {incident.resolvedAt}</span>
                    )}
                  </div>
                </div>

                {/* Dispatched alert targets */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap pt-1">
                  <span className="text-zinc-500">Notified:</span>
                  {incident.dispatchedTo.map((target, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#202615] border border-[#2d361e] text-[11px] text-zinc-300"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
