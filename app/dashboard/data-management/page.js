"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Check,
  X,
  Info,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import { MetricCardsSkeleton } from "@/components/DashboardSkeletons";
import { maintenanceService } from "@/services/maintenanceService";

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
  const { monitors, reloadMonitors, clearLocalLogs } = useDashboard();

  // Maintenance Telemetry
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // If monitors are available and none selected, default to first monitor
  useEffect(() => {
    if (monitors && monitors.length > 0 && !selectedMonitorId) {
      setSelectedMonitorId(monitors[0].id);
    }
  }, [monitors, selectedMonitorId]);

  // 1. Fresh Start Handler: Purge All Logs (+ optionally reset counters)
  const promptPurgeAll = () => {
    setModalConfig({
      isOpen: true,
      title: "Purge All Execution Logs",
      description: resetCountersOnPurge
        ? "This will permanently delete ALL recorded execution logs from the database AND reset all monitor uptime SLAs and ping counts to 100% baseline. Are you sure you want to start afresh?"
        : "This will permanently delete ALL recorded execution audit logs across every monitor from the database. Current uptime counters and SLA calculations will remain untouched.",
      confirmText: "Yes, Purge Everything & Start Fresh",
      confirmStyle: "danger",
      icon: Trash2,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs();
        let counterMsg = "";
        if (resetCountersOnPurge) {
          await maintenanceService.resetMonitorCounters();
          if (reloadMonitors) await reloadMonitors();
          counterMsg = " and all monitor SLA counters have been reset to 100%";
        }
        if (clearLocalLogs) clearLocalLogs();
        await loadStats();
        setToast({
          type: "success",
          message: `Successfully purged ${res?.cleared ?? 0} execution logs${counterMsg}.`,
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
      description: `This will permanently delete all execution run records older than ${days} day${
        days > 1 ? "s" : ""
      } from the database. Newer runs will be safely retained.`,
      confirmText: `Prune Logs Older Than ${days}D`,
      confirmStyle: "warning",
      icon: Clock,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs({ days });
        await loadStats();
        setToast({
          type: "success",
          message: `Cleaned up ${res?.cleared ?? 0} historical execution logs older than ${days} days.`,
        });
      },
    });
  };

  // 3. Targeted Cleanup Handler (Specific Monitor)
  const promptTargetedMonitorCleanup = () => {
    const mon = monitors.find((m) => m.id === selectedMonitorId);
    const monName = mon?.name || selectedMonitorId;

    setModalConfig({
      isOpen: true,
      title: `Purge Logs for "${monName}"`,
      description: `This will permanently remove all execution history specifically recorded for schedule "${monName}". Other monitors will not be affected.`,
      confirmText: "Purge Schedule Logs",
      confirmStyle: "danger",
      icon: Trash2,
      action: async () => {
        const res = await maintenanceService.clearExecutionLogs({ monitorId: selectedMonitorId });
        await loadStats();
        setToast({
          type: "success",
          message: `Purged ${res?.cleared ?? 0} execution runs recorded for ${monName}.`,
        });
      },
    });
  };

  // 4. Targeted Reset Counters Handler (Specific Monitor)
  const promptResetMonitorMetrics = () => {
    const mon = monitors.find((m) => m.id === selectedMonitorId);
    const monName = mon?.name || selectedMonitorId;

    setModalConfig({
      isOpen: true,
      title: `Reset SLA & Pings for "${monName}"`,
      description: `This will reset total pings, failed pings, and consecutive fail counts to 0, returning "${monName}" to a 100.0% SLA baseline.`,
      confirmText: "Reset Monitor Baseline",
      confirmStyle: "warning",
      icon: RotateCcw,
      action: async () => {
        await maintenanceService.resetMonitorCounters(selectedMonitorId);
        if (reloadMonitors) await reloadMonitors();
        await loadStats();
        setToast({
          type: "success",
          message: `Reset uptime metrics and ping counters for "${monName}".`,
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
        ? "This will delete all historical resolved incidents from the database. Ongoing or active incidents will remain visible."
        : "This will permanently delete ALL incident records from the system. Use this only if you want a completely fresh incident log.",
      confirmText: isResolvedOnly ? "Purge Resolved Incidents" : "Purge All Incidents",
      confirmStyle: isResolvedOnly ? "warning" : "danger",
      icon: ShieldAlert,
      action: async () => {
        const res = await maintenanceService.clearIncidents(isResolvedOnly ? "resolved" : "");
        await loadStats();
        setToast({
          type: "success",
          message: `Successfully cleared ${res?.cleared ?? 0} ${
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

  const selectedMonitor = monitors.find((m) => m.id === selectedMonitorId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Data Management & Storage Maintenance"
        subtitle="Control database retention, prune historical execution runs when logs pile up, or perform a complete purge to start afresh."
        actions={
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
            title="Refresh database telemetry"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ffd600]" : ""}`} />
            <span>Refresh Metrics</span>
          </button>
        }
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
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
            className="text-openboy-text-muted hover:text-openboy-text-main p-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      {isLoadingStats ? (
        <MetricCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            title="Execution Runs Stored"
            value={stats ? stats.total_execution_logs.toLocaleString() : "0"}
            icon={Database}
            badge="InnoDB"
            subtitle="Rows currently in database"
            valueColor={stats && stats.total_execution_logs > 5000 ? "text-amber-400" : "text-openboy-text-main"}
          />
          <MetricCard
            title="Storage Footprint"
            value={stats ? `${stats.estimated_storage_mb.toFixed(2)} MB` : "0.00 MB"}
            icon={HardDrive}
            badge="Est."
            subtitle="Execution buffer disk space"
          />
          <MetricCard
            title="Oldest Recorded Run"
            value={stats ? formatDate(stats.oldest_log_timestamp) : "None"}
            icon={Clock}
            subtitle={stats && stats.newest_log_timestamp ? `Latest: ${formatDate(stats.newest_log_timestamp)}` : "Earliest log in storage"}
          />
          <MetricCard
            title="Incident Records"
            value={stats ? stats.total_incidents.toLocaleString() : "0"}
            icon={ShieldAlert}
            badge="SLAs"
            subtitle="Historical outage incident logs"
          />
        </div>
      )}

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Fresh Start / Total Purge */}
        <div className="bg-openboy-surface border border-openboy-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-openboy-text-main">
                    Total Purge & Start Afresh
                  </h2>
                  <p className="text-xs text-openboy-text-muted mt-0.5">
                    Wipe all execution records and reset system state
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                Destructive
              </span>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              Use this option when you want to start clean. It wipes the entire execution audit trail across all schedules, freeing up storage and restarting graphs from zero.
            </p>

            {/* Checkbox option */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border cursor-pointer hover:border-openboy-border-light transition-colors">
              <input
                type="checkbox"
                checked={resetCountersOnPurge}
                onChange={(e) => setResetCountersOnPurge(e.target.checked)}
                className="mt-0.5 rounded border-openboy-border text-[#ffd600] focus:ring-[#ffd600] focus:ring-offset-0 bg-openboy-surface"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-openboy-text-main block">
                  Also reset monitor ping counters & restore 100% SLA baseline
                </span>
                <span className="text-[11px] text-openboy-text-muted block">
                  Resets total_pings, failed_pings, and consecutive fails to 0 for all monitors.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-6 border-t border-openboy-border mt-6">
            <button
              type="button"
              onClick={promptPurgeAll}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Logs & Start Afresh</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Retention Pruning (When Logs Pile Up) */}
        <div className="bg-openboy-surface border border-openboy-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd600]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ffd600]/10 border border-[#ffd600]/20 flex items-center justify-center text-[#ffd600]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-openboy-text-main">
                    Retention Pruning (When Logs Pile Up)
                  </h2>
                  <p className="text-xs text-openboy-text-muted mt-0.5">
                    Purge older history while preserving recent activity
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ffd600]/10 border border-[#ffd600]/20 text-[#ffd600] font-semibold">
                Retention
              </span>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              When frequent schedules run continuously, execution audit logs pile up over time. Select a retention threshold below to safely trim old rows while keeping your recent timeline.
            </p>

            {/* Retention Quick Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-openboy-text-muted block">
                Quick Retention Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 1, label: "Older than 24h" },
                  { days: 7, label: "Older than 7d" },
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
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#ffd600] text-black border-[#ffd600] shadow-xs"
                          : "bg-openboy-surface-subtle border-openboy-border text-openboy-text-muted hover:text-openboy-text-main hover:border-openboy-border-light"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Days Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-openboy-text-muted shrink-0">Or custom:</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  placeholder="e.g. 14 days"
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-full bg-openboy-surface-subtle border border-openboy-border rounded-xl px-3 py-1.5 text-xs text-openboy-text-main placeholder-openboy-text-dim focus:outline-none focus:border-[#ffd600]"
                />
              </div>
              <span className="text-xs text-openboy-text-muted">days</span>
            </div>
          </div>

          <div className="pt-6 border-t border-openboy-border mt-6">
            <button
              type="button"
              onClick={promptRetentionPruning}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>
                Prune Logs Older Than {customDays ? `${customDays} Days` : `${retentionDays} Days`}
              </span>
            </button>
          </div>
        </div>

        {/* CARD 3: Targeted Cleanup by Monitor */}
        <div className="bg-openboy-surface border border-openboy-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-openboy-text-main">
                    Targeted Schedule Cleanup
                  </h2>
                  <p className="text-xs text-openboy-text-muted mt-0.5">
                    Clear execution runs or reset counters for a single endpoint
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                Per-Monitor
              </span>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              Target a specific endpoint that had heavy testing or erratic test runs, without touching logs from other monitored services.
            </p>

            {/* Monitor Dropdown Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-openboy-text-muted block">
                Select Schedule / Monitor:
              </label>
              <select
                value={selectedMonitorId}
                onChange={(e) => setSelectedMonitorId(e.target.value)}
                className="w-full bg-openboy-surface-subtle border border-openboy-border rounded-xl px-3 py-2 text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600] font-mono"
              >
                {monitors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.interval} • {m.url})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Monitor Info Card */}
            {selectedMonitor && (
              <div className="p-3 rounded-xl bg-openboy-surface-subtle border border-openboy-border text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-openboy-text-muted">
                  <span>Current Lifetime Runs:</span>
                  <span className="text-openboy-text-main font-semibold">
                    {selectedMonitor.totalPings?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-openboy-text-muted">
                  <span>Failed Dispatches:</span>
                  <span className={selectedMonitor.failedPings > 0 ? "text-rose-400 font-semibold" : "text-openboy-text-main"}>
                    {selectedMonitor.failedPings ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-openboy-text-muted">
                  <span>Current 24h SLA:</span>
                  <span className="text-[#ffd600] font-semibold">
                    {selectedMonitor.uptimePct || "100.0%"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-openboy-border mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!selectedMonitorId}
              onClick={promptTargetedMonitorCleanup}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Selected Schedule Logs</span>
            </button>
            <button
              type="button"
              disabled={!selectedMonitorId}
              onClick={promptResetMonitorMetrics}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-main transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-openboy-text-muted" />
              <span>Reset SLA to 100%</span>
            </button>
          </div>
        </div>

        {/* CARD 4: Incident Log Maintenance */}
        <div className="bg-openboy-surface border border-openboy-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-openboy-text-main">
                    Incident Audit Maintenance
                  </h2>
                  <p className="text-xs text-openboy-text-muted mt-0.5">
                    Clear resolved or archived outage records
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                Incidents
              </span>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              When endpoints experience transient downtime, incident reports are stored for SLA compliance. Clean up resolved incident history once incidents have been remediated.
            </p>

            <div className="p-3.5 rounded-xl bg-openboy-surface-subtle border border-openboy-border flex items-start gap-2.5 text-xs text-openboy-text-muted">
              <Info className="w-4 h-4 text-openboy-text-dim shrink-0 mt-0.5" />
              <span>
                "Purge Resolved Only" leaves any ongoing outages untouched so active incidents remain visible in your Incidents dashboard.
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-openboy-border mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => promptClearIncidents("resolved")}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Purge Resolved Incidents Only</span>
            </button>
            <button
              type="button"
              onClick={() => promptClearIncidents("")}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-rose-900/50 hover:bg-rose-950/30 text-rose-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Incidents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Custom OpenBoy Design - No browser alert/confirm!) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-openboy-surface border border-openboy-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modalConfig.confirmStyle === "danger"
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                }`}
              >
                {<modalConfig.icon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-openboy-text-main">
                  {modalConfig.title}
                </h3>
                <span className="text-[11px] font-mono text-openboy-text-muted">
                  Database Confirmation
                </span>
              </div>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              {modalConfig.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-openboy-border">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-openboy-border hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleModalConfirm}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  modalConfig.confirmStyle === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Maintenance...</span>
                  </>
                ) : (
                  <>
                    {<modalConfig.icon className="w-3.5 h-3.5" />}
                    <span>{modalConfig.confirmText}</span>
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
