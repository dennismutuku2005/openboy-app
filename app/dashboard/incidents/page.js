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
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import SearchInput from "@/components/SearchInput";
import FilterTabs from "@/components/FilterTabs";
import StatusBadge from "@/components/StatusBadge";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { incidentService } from "@/services/incidentService";

export default function IncidentsPage() {
  const { monitors, triggerPing, isLoadingAuth } = useDashboard();
  const [incidents, setIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const [resolveModal, setResolveModal] = useState({ isOpen: false, incident: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, incident: null });

  // Fetch real incidents from incidentService on mount
  useEffect(() => {
    let mounted = true;
    async function loadIncidents() {
      try {
        const data = await incidentService.getIncidents();
        if (mounted) {
          setIncidents(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) setIncidents([]);
      }
    }
    loadIncidents();
    return () => {
      mounted = false;
    };
  }, []);

  const activeFailingMonitors = (monitors || []).filter((m) => m.status === "failing");

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

  // Infinite load: 12 per batch
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

  const promptResolve = (incident) => {
    setResolveModal({ isOpen: true, incident });
  };

  const confirmResolve = async () => {
    if (resolveModal.incident) {
      const incidentId = resolveModal.incident.id;
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? {
                ...inc,
                status: "resolved",
                resolvedAt: "Just now",
                duration: "Resolved in 26m",
              }
            : inc
        )
      );
      try {
        await incidentService.resolveIncident(incidentId);
      } catch {}
    }
    setResolveModal({ isOpen: false, incident: null });
  };

  const promptDelete = (incident) => {
    setDeleteModal({ isOpen: true, incident });
  };

  const confirmDelete = async () => {
    if (deleteModal.incident) {
      const incidentId = deleteModal.incident.id;
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
      try {
        await incidentService.deleteIncident(incidentId);
      } catch {}
    }
    setDeleteModal({ isOpen: false, incident: null });
  };

  const runDiagnostics = (monitorId) => {
    triggerPing(monitorId);
  };

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-openboy-border-light rounded animate-pulse"></div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-openboy-surface rounded-xl border border-openboy-border animate-pulse"></div>
      </div>
    );
  }

  const severityTabs = [
    { id: "all", label: "All Severities", count: incidents.length },
    { id: "ongoing", label: "Investigating", count: incidents.filter((i) => i.status === "investigating").length },
    { id: "p1", label: "P1 - Critical", count: incidents.filter((i) => i.severity.includes("P1")).length },
    { id: "p2", label: "P2 - High", count: incidents.filter((i) => i.severity.includes("P2")).length },
    { id: "p3", label: "P3 - Moderate", count: incidents.filter((i) => i.severity.includes("P3")).length },
    { id: "resolved", label: "Resolved", count: incidents.filter((i) => i.status === "resolved").length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Incidents & Downtime Alarms"
        subtitle="Normalized production table of downtime alarms, MTTR telemetry, and root-cause post-mortems."
      />

      {/* Metrics Row using Shareable MetricCard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Active Outages"
          value={incidents.filter((i) => i.status === "investigating").length + activeFailingMonitors.length}
          valueColor="text-rose-500 dark:text-rose-400"
          subtitle="Requires engineer triage"
          icon={AlertTriangle}
        />

        <MetricCard
          title="Mean Time to Recover (MTTR)"
          value="4m 12s"
          trend="Past 30 days average"
          trendType="success"
          icon={Clock}
        />

        <MetricCard
          title="Overall Availability"
          value="99.94%"
          valueColor="text-emerald-500 dark:text-emerald-400"
          subtitle="Across all cron endpoints"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Alert Destinations"
          value="PagerDuty / Slack"
          subtitle="Auto-escalation enabled"
          icon={Bell}
        />
      </div>

      {/* Filter Row & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-openboy-border pb-3">
        <FilterTabs
          tabs={severityTabs}
          activeTab={filterSeverity}
          onChange={(tabId) => {
            setFilterSeverity(tabId);
            setVisibleCount(12);
          }}
        />

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search incident records..."
          containerClassName="w-full md:w-64"
        />
      </div>

      {/* High-Density Incidents Table */}
      <div className="rounded-xl border border-openboy-border bg-openboy-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead className="bg-openboy-surface-subtle text-openboy-text-muted font-mono border-b border-openboy-border">
              <tr>
                <th className="py-3 px-4 font-semibold w-[120px]">Severity</th>
                <th className="py-3 px-4 font-semibold w-[110px]">Status</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Incident / Affected Service</th>
                <th className="py-3 px-4 font-semibold w-[140px]">Duration / Started</th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Root Cause Trace</th>
                <th className="py-3 px-4 text-right font-semibold w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-openboy-border font-mono">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-openboy-text-muted">
                    No incidents match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.slice(0, visibleCount).map((inc) => (
                  <tr key={inc.id} className="hover:bg-openboy-surface-hover transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.severity} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>

                    <td className="py-3.5 px-4 font-sans max-w-xs">
                      <div className="font-semibold text-openboy-text-main line-clamp-1">{inc.title}</div>
                      <div className="text-[11px] text-openboy-text-muted font-mono truncate">{inc.service}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-openboy-text-muted">
                      <div>{inc.duration}</div>
                      <div className="text-[10px] text-openboy-text-dim">{inc.startedAt}</div>
                    </td>

                    <td className="py-3.5 px-4 font-sans max-w-sm text-openboy-text-muted">
                      <div className="line-clamp-2 text-[11px] leading-relaxed">{inc.cause}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {inc.status === "investigating" ? (
                          <button
                            type="button"
                            onClick={() => promptResolve(inc)}
                            className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-sans font-semibold cursor-pointer transition-colors"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promptDelete(inc)}
                            className="p-1.5 text-openboy-text-muted hover:text-rose-500 hover:bg-openboy-surface-subtle rounded cursor-pointer transition-colors"
                            title="Delete incident entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

      {/* Resolve Incident Modal Dialog */}
      {resolveModal.isOpen && resolveModal.incident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-openboy-text-main">Mark Incident as Resolved</h3>
                  <p className="text-xs text-openboy-text-muted mt-0.5">Post-mortem will be timestamped.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolveModal({ isOpen: false, incident: null })}
                className="p-1 rounded-md text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-openboy-surface-subtle border border-openboy-border rounded-xl space-y-1 font-mono text-xs">
              <div className="font-semibold text-openboy-text-main truncate">
                {resolveModal.incident.title}
              </div>
              <div className="text-openboy-text-muted truncate text-[11px]">
                {resolveModal.incident.service}
              </div>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              Confirming resolution will archive this active outage, calculate the final MTTR downtime duration, and notify on-call escalation channels.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResolveModal({ isOpen: false, incident: null })}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main border border-openboy-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResolve}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#ffd600] hover:bg-[#eed000] text-black transition-all shadow-md cursor-pointer"
              >
                Confirm Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incident Modal Dialog */}
      {deleteModal.isOpen && deleteModal.incident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-openboy-text-main">Delete Incident Record</h3>
                  <p className="text-xs text-openboy-text-muted mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, incident: null })}
                className="p-1 rounded-md text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-openboy-surface-subtle border border-openboy-border rounded-xl space-y-1 font-mono text-xs">
              <div className="font-semibold text-openboy-text-main truncate">
                {deleteModal.incident.title}
              </div>
              <div className="text-openboy-text-muted truncate text-[11px]">
                {deleteModal.incident.service}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, incident: null })}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main border border-openboy-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
