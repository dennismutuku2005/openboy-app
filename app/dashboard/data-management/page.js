"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Database,
  HardDrive,
  Trash2,
  RotateCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
  X,
  Check,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import { MetricCardsSkeleton } from "@/components/DashboardSkeletons";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { maintenanceService } from "@/services/maintenanceService";

/**
 * Custom OpenBoy high-precision dual-ring spinner.
 * Pure SVG/CSS, silky smooth 60fps animation, zero external loader dependencies.
 */
function OpenBoyLoader({ size = "w-4 h-4", color = "text-[#ffd600]" }) {
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${size}`}>
      <svg
        className={`animate-spin ${size} ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-95"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return "None";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "None";
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "None";
  }
}

export default function DataManagementPage() {
  const { monitors = [], reloadMonitors, clearLocalLogs } = useDashboard();

  // Maintenance Telemetry
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState("fresh-start"); // "fresh-start" | "retention" | "monitor" | "incidents"

  // Notification Toast
  const [toast, setToast] = useState(null);

  // Fresh Start State
  const [resetCountersOnPurge, setResetCountersOnPurge] = useState(true);

  // Retention Cleanup State
  const [retentionDays, setRetentionDays] = useState(7);
  const [customDays, setCustomDays] = useState("");

  // Targeted Monitor Cleanup State
  const [selectedMonitorId, setSelectedMonitorId] = useState("");

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    confirmStyle: "danger", // "danger" | "warning" | "primary"
    icon: Trash2,
    action: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-hide toast after 5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load telemetry stats from backend
  const loadStats = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await maintenanceService.getMaintenanceStats();
      if (res) {
        setStats(res);
      }
    } catch (err) {
      console.error("Failed to load maintenance telemetry:", err);
    } finally {
      setIsLoadingStats(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Default to first monitor if available
  useEffect(() => {
    if (monitors && monitors.length > 0 && !selectedMonitorId) {
      setSelectedMonitorId(monitors[0].id);
    }
  }, [monitors, selectedMonitorId]);

  // Safe normalized numbers (handles both camelCase and snake_case from Go JSON)
  const totalLogs = Number(stats?.totalExecutionLogs ?? stats?.total_execution_logs ?? 0);
  const totalIncidents = Number(stats?.totalIncidents ?? stats?.total_incidents ?? 0);
  const storageMb = Number(stats?.estimatedStorageMb ?? stats?.estimated_storage_mb ?? 0);
  const oldestDate = stats?.oldestLogTimestamp || stats?.oldest_log_timestamp || null;
  const newestDate = stats?.newestLogTimestamp || stats?.newest_log_timestamp || null;

  // Selected monitor lookup
  const selectedMonitor = useMemo(
    () => monitors.find((m) => m.id === selectedMonitorId) || null,
    [monitors, selectedMonitorId]
  );

  // Navigation Tabs Definition
  const tabs = [
    { id: "fresh-start", label: "Fresh Start", icon: Sparkles },
    { id: "retention", label: "Retention Pruning", icon: Clock },
    { id: "monitor", label: "By Schedule", icon: Layers },
    { id: "incidents", label: "Incident Records", icon: ShieldAlert },
  ];

  // 1. Fresh Start Handler: Purge All Logs (+ optionally reset counters)
  const promptPurgeAll = () => {
    setModalConfig({
      isOpen: true,
      title: "Purge All Execution Logs",
      description: resetCountersOnPurge
        ? "This will permanently delete all execution logs from the database AND reset all monitor uptime SLAs and ping counts to 100% baseline. Are you sure you want to start afresh?"
        : "This will permanently delete all execution logs across every schedule from the database. Monitor ping counters and SLA calculations will remain untouched.",
      confirmText: "Yes, Start Fresh",
      confirmStyle: "danger",
      icon: Trash2,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs();
        let counterMsg = "";
        if (resetCountersOnPurge) {
          await maintenanceService.resetMonitorCounters();
          if (reloadMonitors) await reloadMonitors();
          counterMsg = " and all monitor SLA baselines have been reset to 100%";
        }
        if (clearLocalLogs) clearLocalLogs();
        await loadStats();
        setToast({
          type: "success",
          message: `Successfully purged ${Number(res?.cleared ?? 0).toLocaleString()} execution logs${counterMsg}.`,
        });
      },
    });
  };

  // 2. Retention Pruning Handler
  const promptRetentionPruning = () => {
    const days = customDays ? parseInt(customDays, 10) : retentionDays;
    if (isNaN(days) || days <= 0) {
      setToast({ type: "error", message: "Please specify a valid number of days (> 0)." });
      return;
    }

    setModalConfig({
      isOpen: true,
      title: `Prune Logs Older Than ${days} Day${days > 1 ? "s" : ""}`,
      description: `Permanently delete execution logs older than ${days} day${
        days > 1 ? "s" : ""
      } from the database. Recent runs will be kept intact.`,
      confirmText: `Prune Older Than ${days}D`,
      confirmStyle: "warning",
      icon: Clock,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs({ days });
        await loadStats();
        setToast({
          type: "success",
          message: `Cleaned up ${Number(res?.cleared ?? 0).toLocaleString()} logs older than ${days} days.`,
        });
      },
    });
  };

  // 3. Targeted Cleanup Handler (Specific Monitor)
  const promptTargetedMonitorCleanup = () => {
    const monName = selectedMonitor?.name || selectedMonitorId;

    setModalConfig({
      isOpen: true,
      title: `Purge Logs for "${monName}"`,
      description: `Permanently delete execution logs recorded for schedule "${monName}". Other monitors will not be touched.`,
      confirmText: "Purge Schedule Logs",
      confirmStyle: "danger",
      icon: Trash2,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs({ monitorId: selectedMonitorId });
        await loadStats();
        setToast({
          type: "success",
          message: `Purged ${Number(res?.cleared ?? 0).toLocaleString()} logs recorded for ${monName}.`,
        });
      },
    });
  };

  // 4. Targeted Reset Counters Handler (Specific Monitor)
  const promptResetMonitorMetrics = () => {
    const monName = selectedMonitor?.name || selectedMonitorId;

    setModalConfig({
      isOpen: true,
      title: `Reset SLA for "${monName}"`,
      description: `Reset total pings and failed pings to 0, restoring "${monName}" to 100.0% SLA baseline.`,
      confirmText: "Reset SLA to 100%",
      confirmStyle: "warning",
      icon: RotateCcw,
      action: async () => {
        await maintenanceService.resetMonitorCounters(selectedMonitorId);
        if (reloadMonitors) await reloadMonitors();
        await loadStats();
        setToast({
          type: "success",
          message: `Reset SLA metrics and ping counters for "${monName}".`,
        });
      },
    });
  };

  // 5. Incident Pruning Handler
  const promptClearIncidents = (statusOnly = "resolved") => {
    const isResolvedOnly = statusOnly === "resolved";
    setModalConfig({
      isOpen: true,
      title: isResolvedOnly ? "Purge Resolved Incidents" : "Purge All Incident Logs",
      description: isResolvedOnly
        ? "Permanently delete resolved incidents from the database. Ongoing outages remain untouched."
        : "Permanently delete all incident records across the system.",
      confirmText: isResolvedOnly ? "Purge Resolved Only" : "Purge All Incidents",
      confirmStyle: isResolvedOnly ? "warning" : "danger",
      icon: ShieldAlert,
      action: async () => {
        const res = await maintenanceService.clearIncidents(isResolvedOnly ? "resolved" : "");
        await loadStats();
        setToast({
          type: "success",
          message: `Cleared ${Number(res?.cleared ?? 0).toLocaleString()} ${
            isResolvedOnly ? "resolved" : ""
          } incident records.`,
        });
      },
    });
  };

  // Execute confirmed modal action
  const handleModalConfirm = async () => {
    if (!modalConfig.action) return;
    setIsSubmitting(true);
    try {
      await modalConfig.action();
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Maintenance action failed:", err);
      setToast({
        type: "error",
        message: err.message || "Failed to execute database maintenance operation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full">
      {/* Page Header */}
      <PageHeader
        title="Data Management"
        subtitle="Manage database retention, prune accumulated execution logs, or purge data to start afresh."
        actions={
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
            title="Refresh database telemetry"
          >
            {isRefreshing ? (
              <OpenBoyLoader size="w-3.5 h-3.5" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-openboy-text-muted" />
            )}
            <span>Refresh</span>
          </button>
        }
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
            toast.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/60 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-openboy-text-muted hover:text-openboy-text-main p-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Telemetry Strip: Responsive Grid of Two on Phones (grid-cols-2 lg:grid-cols-4) */}
      {isLoadingStats ? (
        <MetricCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <MetricCard
            title="Total Runs Stored"
            value={totalLogs.toLocaleString()}
            icon={Database}
            subtitle="Rows in database"
            valueColor={totalLogs > 5000 ? "text-amber-400" : "text-openboy-text-main"}
          />
          <MetricCard
            title="Storage Footprint"
            value={`${storageMb.toFixed(2)} MB`}
            icon={HardDrive}
            subtitle="Buffer disk space"
          />
          <MetricCard
            title="Oldest Run"
            value={formatDate(oldestDate)}
            icon={Clock}
            subtitle={newestDate ? `Latest: ${formatDate(newestDate)}` : "Earliest log"}
          />
          <MetricCard
            title="Incidents Stored"
            value={totalIncidents.toLocaleString()}
            icon={ShieldAlert}
            subtitle="Outage incident logs"
          />
        </div>
      )}

      {/* Mode Navigation: Responsive Grid of Two on Phones (grid-cols-2 sm:grid-cols-4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 text-xs rounded-xl transition-all cursor-pointer font-medium flex items-center justify-center sm:justify-start gap-2 border text-center ${
                isActive
                  ? "bg-[#ffd600] text-black font-bold border-[#ffd600] shadow-xs active:scale-[0.98]"
                  : "bg-openboy-surface text-openboy-text-muted hover:text-openboy-text-main border-openboy-border hover:bg-openboy-surface-hover"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-black" : "text-openboy-text-dim"}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels (Full Width Cards) */}
      <div className="w-full">
        {/* TAB 1: FRESH START */}
        {activeTab === "fresh-start" && (
          <Card className="border-openboy-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <Sparkles className="w-4 h-4 text-[#ffd600]" />
                  <span>Start Afresh (Total Purge)</span>
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  Destructive
                </span>
              </div>
              <CardDescription>
                Wipe all historical execution audit logs across all schedules to start clean with zero rows.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Buffer impact summary */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border text-xs w-full">
                <span className="text-openboy-text-muted">Current Execution Rows to Wipe:</span>
                <span className="font-mono font-bold text-openboy-text-main">
                  {totalLogs.toLocaleString()} runs ({storageMb.toFixed(2)} MB)
                </span>
              </div>

              {/* Reset counters toggle */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border cursor-pointer hover:border-openboy-border-light transition-colors w-full">
                <input
                  type="checkbox"
                  checked={resetCountersOnPurge}
                  onChange={(e) => setResetCountersOnPurge(e.target.checked)}
                  className="mt-0.5 rounded border-openboy-border text-[#ffd600] focus:ring-[#ffd600] focus:ring-offset-0 bg-openboy-surface"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-openboy-text-main block">
                    Also reset monitor ping counters and restore 100.0% SLA baseline
                  </span>
                  <span className="text-[11px] text-openboy-text-muted block">
                    Resets lifetime dispatches, failure tallies, and restarts uptime graphs from 100%.
                  </span>
                </div>
              </label>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={promptPurgeAll}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge All Logs & Start Afresh</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: RETENTION PRUNING */}
        {activeTab === "retention" && (
          <Card className="border-openboy-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <Clock className="w-4 h-4 text-[#ffd600]" />
                  <span>Retention Pruning (When Logs Pile Up)</span>
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ffd600]/10 border border-[#ffd600]/20 text-[#ffd600] font-medium">
                  Retention
                </span>
              </div>
              <CardDescription>
                When frequent schedules pile up over time, prune older entries while preserving recent timelines.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Presets: Grid of two on phones */}
              <div className="space-y-2 w-full">
                <label className="text-[11px] font-mono text-openboy-text-muted block">
                  Select Age Threshold:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                  {[
                    { days: 1, label: "Older than 24h" },
                    { days: 7, label: "Older than 7d" },
                    { days: 14, label: "Older than 14d" },
                    { days: 30, label: "Older than 30d" },
                  ].map((preset) => {
                    const isSelected = retentionDays === preset.days && !customDays;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => {
                          setRetentionDays(preset.days);
                          setCustomDays("");
                        }}
                        className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-[#ffd600] text-black border-[#ffd600] shadow-xs font-bold"
                            : "bg-openboy-surface-subtle border-openboy-border text-openboy-text-muted hover:text-openboy-text-main hover:border-openboy-border-light"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom input */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-openboy-text-muted shrink-0">Or custom threshold:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  placeholder="e.g. 21"
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-28 bg-openboy-surface-subtle border border-openboy-border rounded-lg px-2.5 py-1.5 text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600] font-mono"
                />
                <span className="text-xs text-openboy-text-muted">days</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={promptRetentionPruning}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    Prune Logs Older Than {customDays ? `${customDays} Days` : `${retentionDays} Days`}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: BY SCHEDULE */}
        {activeTab === "monitor" && (
          <Card className="border-openboy-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Targeted Schedule Cleanup</span>
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                  Per-Monitor
                </span>
              </div>
              <CardDescription>
                Clean up logs or reset SLA metrics for a specific endpoint without touching others.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Monitor Dropdown */}
              <div className="space-y-1.5 w-full">
                <label className="text-[11px] font-mono text-openboy-text-muted block">
                  Select Target Schedule:
                </label>
                <select
                  value={selectedMonitorId}
                  onChange={(e) => setSelectedMonitorId(e.target.value)}
                  className="w-full bg-openboy-surface-subtle border border-openboy-border rounded-lg px-3 py-2 text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600] font-mono"
                >
                  {monitors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.interval} • {m.url})
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Metrics: Grid of Two on Phones (grid-cols-2 sm:grid-cols-3) */}
              {selectedMonitor && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border text-xs w-full">
                  <div>
                    <span className="text-[11px] text-openboy-text-muted block">Total Runs</span>
                    <span className="text-sm font-bold font-mono text-openboy-text-main mt-0.5 block">
                      {Number(selectedMonitor.totalPings ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-openboy-text-muted block">Failures</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${selectedMonitor.failedPings > 0 ? "text-rose-400" : "text-openboy-text-main"}`}>
                      {Number(selectedMonitor.failedPings ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-openboy-text-muted block">24h SLA</span>
                    <span className="text-sm font-bold font-mono text-[#ffd600] mt-0.5 block">
                      {selectedMonitor.uptimePct || "100.0%"}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  disabled={!selectedMonitorId}
                  onClick={promptTargetedMonitorCleanup}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Selected Schedule Logs</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedMonitorId}
                  onClick={promptResetMonitorMetrics}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-main transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-openboy-text-muted" />
                  <span>Reset SLA Baseline to 100%</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: INCIDENTS */}
        {activeTab === "incidents" && (
          <Card className="border-openboy-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Incident Audit Records</span>
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">
                  Incidents
                </span>
              </div>
              <CardDescription>
                Clear resolved or archived outage records once service incidents have been resolved.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              <div className="p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border text-xs flex items-center justify-between w-full">
                <span className="text-openboy-text-muted">Total Stored Incident Reports:</span>
                <span className="font-mono font-bold text-openboy-text-main">
                  {totalIncidents.toLocaleString()} records
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => promptClearIncidents("resolved")}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Purge Resolved Incidents Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => promptClearIncidents("")}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-900/50 hover:bg-rose-950/30 text-rose-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge All Incidents</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Modal (Custom OpenBoy Clean Design with Symmetrical Side-by-Side Buttons) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-all">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    modalConfig.confirmStyle === "danger"
                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400"
                      : "bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400"
                  }`}
                >
                  {<modalConfig.icon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-openboy-text-main">
                    {modalConfig.title}
                  </h3>
                  <p className="text-[11px] font-mono text-openboy-text-muted mt-0.5">
                    Database Confirmation
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-md text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-hover transition-colors cursor-pointer disabled:opacity-50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description Card */}
            <div className="p-3.5 bg-openboy-surface-subtle border border-openboy-border rounded-xl text-xs text-openboy-text-muted leading-relaxed">
              {modalConfig.description}
            </div>

            {/* Symmetrical Side-by-Side Buttons (Grid of Two: Cancel left, Action right) */}
            <div className="grid grid-cols-2 gap-3 pt-1 w-full">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-openboy-border bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleModalConfirm}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 text-center ${
                  modalConfig.confirmStyle === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <OpenBoyLoader
                      size="w-3.5 h-3.5"
                      color={modalConfig.confirmStyle === "danger" ? "text-white" : "text-black"}
                    />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    {<modalConfig.icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{modalConfig.confirmText}</span>
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
