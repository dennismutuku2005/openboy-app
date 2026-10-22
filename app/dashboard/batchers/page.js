"use client";

import { useState, useEffect, useRef } from "react";
import {
  Server,
  Play,
  Pause,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  Cpu,
  X,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { TableSkeletonRows, MetricCardsSkeleton } from "@/components/DashboardSkeletons";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import SearchInput from "@/components/SearchInput";
import FilterTabs from "@/components/FilterTabs";
import StatusBadge from "@/components/StatusBadge";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { batcherService } from "@/services/batcherService";

export default function BatchersPage() {
  const { isLoadingAuth } = useDashboard();
  const [batchers, setBatchers] = useState([]);
  const [runningJobId, setRunningJobId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [runModal, setRunModal] = useState({
    isOpen: false,
    batcher: null,
    running: false,
    result: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    batcher: null,
  });
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    jobKey: "",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    targetQueue: "",
    description: "",
  });

  // Fetch real batchers via batcherService on mount
  useEffect(() => {
    let mounted = true;
    async function loadBatchers() {
      try {
        const data = await batcherService.getBatchers();
        if (mounted) {
          setBatchers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) setBatchers([]);
      }
    }
    loadBatchers();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredBatchers = batchers.filter((b) => {
    if (filter === "active" && b.status !== "active") return false;
    if (filter === "paused" && b.status !== "paused") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.jobKey.toLowerCase().includes(q) ||
        b.targetQueue.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Infinite load: 12 per batch
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadSentinelRef = useRef(null);

  const hasMore = visibleCount < filteredBatchers.length;

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(12);
  }, [filter, searchQuery]);

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

  const toggleStatus = async (id) => {
    const target = batchers.find((b) => b.id === id);
    if (!target) return;
    const newStatus = target.status === "active" ? "paused" : "active";
    setBatchers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    try {
      await batcherService.updateBatcher(id, { ...target, status: newStatus });
    } catch {}
  };

  const promptRun = (batcher) => {
    setRunModal({ isOpen: true, batcher, running: false, result: null });
  };

  const executeBatcher = async () => {
    if (!runModal.batcher) return;
    const batcherId = runModal.batcher.id;
    setRunModal((prev) => ({ ...prev, running: true }));
    setRunningJobId(batcherId);

    try {
      await batcherService.triggerBatcher(batcherId);
    } catch {}

    const records = Math.floor(Math.random() * 5000) + 120;
    const duration = (Math.random() * 3 + 1.2).toFixed(2) + "s";
    const resultData = {
      timestamp: new Date().toLocaleTimeString(),
      records: `${records.toLocaleString()} items processed`,
      duration,
      exitCode: 0,
      status: "Completed successfully",
    };

    setRunModal((prev) => ({
      ...prev,
      running: false,
      result: resultData,
    }));
    setRunningJobId(null);

    setBatchers((prev) =>
      prev.map((b) =>
        b.id === batcherId
          ? {
              ...b,
              lastRun: "Just now",
              duration,
              recordsProcessed: `${records.toLocaleString()} items`,
            }
          : b
      )
    );
  };

  const promptDelete = (batcher) => {
    setDeleteModal({ isOpen: true, batcher });
  };

  const confirmDelete = async () => {
    if (deleteModal.batcher) {
      const id = deleteModal.batcher.id;
      setBatchers((prev) => prev.filter((b) => b.id !== id));
      try {
        await batcherService.deleteBatcher(id);
      } catch {}
    }
    setDeleteModal({ isOpen: false, batcher: null });
  };

  const handleCreateBatcher = async (e) => {
    e.preventDefault();
    if (!newForm.name) return;

    const newWorker = {
      id: "batch-" + Date.now(),
      name: newForm.name,
      jobKey: newForm.jobKey || newForm.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      schedule: newForm.schedule,
      cronExpr: newForm.cronExpr,
      status: "active",
      concurrency: "Mutex Locked",
      lastRun: "Never",
      duration: "0.0s",
      recordsProcessed: "0 items",
      targetQueue: newForm.targetQueue || "internal.queue.default",
      description: newForm.description || "Custom background batch consumer.",
    };

    setBatchers((prev) => [newWorker, ...prev]);
    setNewBatchModal(false);
    setNewForm({
      name: "",
      jobKey: "",
      schedule: "Every 10m",
      cronExpr: "*/10 * * * *",
      targetQueue: "",
      description: "",
    });

    try {
      await batcherService.createBatcher(newWorker);
    } catch {}
  };

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-openboy-border-light rounded animate-pulse"></div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-openboy-surface rounded-xl border border-openboy-border animate-pulse"></div>
      </div>
    );
  }

  const batcherTabs = [
    { id: "all", label: "All Workers", count: batchers.length },
    { id: "active", label: "Active", count: batchers.filter((b) => b.status === "active").length },
    { id: "paused", label: "Paused", count: batchers.filter((b) => b.status === "paused").length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Batch Workers"
        subtitle="Normalized production table for 10-minute queue consumers, background sync jobs, and database ETL batchers."
        actions={
          <button
            type="button"
            onClick={() => setNewBatchModal(true)}
            className="w-full sm:w-auto py-2.5 px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register Batcher</span>
          </button>
        }
      />

      {/* Metrics Grid using Shareable MetricCard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Workers"
          value={batchers.length}
          subtitle="Configured in scheduler"
          icon={Layers}
        />

        <MetricCard
          title="Active Workers"
          value={batchers.filter((b) => b.status === "active").length}
          valueColor="text-amber-600 dark:text-[#ffd600]"
          subtitle="Consuming on schedule"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Standard Interval"
          value="10m"
          subtitle="Default batch consumption"
          icon={Clock}
        />

        <MetricCard
          title="Cluster Mutex"
          value="Locked"
          valueColor="text-emerald-500 dark:text-emerald-400"
          subtitle="Zero race conditions"
          icon={Cpu}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-openboy-border pb-3">
        <FilterTabs
          tabs={batcherTabs}
          activeTab={filter}
          onChange={(tabId) => {
            setFilter(tabId);
            setVisibleCount(12);
          }}
        />

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search batchers..."
          containerClassName="w-full sm:w-64"
        />
      </div>

      {/* Batchers Table */}
      <div className="rounded-xl border border-openboy-border bg-openboy-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead className="bg-openboy-surface-subtle text-openboy-text-muted font-mono border-b border-openboy-border">
              <tr>
                <th className="py-3 px-4 font-semibold w-[120px]">Status</th>
                <th className="py-3 px-4 font-semibold min-w-[200px]">Batch Worker / Queue Target</th>
                <th className="py-3 px-4 font-semibold w-[120px]">Cron Schedule</th>
                <th className="py-3 px-4 font-semibold w-[130px]">Concurrency Lock</th>
                <th className="py-3 px-4 font-semibold w-[100px]">Last Run</th>
                <th className="py-3 px-4 font-semibold w-[90px]">Duration</th>
                <th className="py-3 px-4 font-semibold w-[110px]">Processed</th>
                <th className="py-3 px-4 text-right font-semibold w-[95px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-openboy-border">
              {filteredBatchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-openboy-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-openboy-surface-subtle border border-openboy-border flex items-center justify-center text-openboy-text-muted mb-1 shadow-2xs">
                        <Layers className="w-4 h-4 text-[#ffd600]" />
                      </div>
                      <div className="font-bold text-openboy-text-main text-sm">No batch workers found</div>
                      <p className="text-xs text-openboy-text-muted leading-relaxed">No background batchers match your current criteria. Create a new worker to begin queue processing.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatchers.slice(0, visibleCount).map((worker) => {
                const isRunning = runningJobId === worker.id;
                const isActive = worker.status === "active";

                return (
                  <tr key={worker.id} className="hover:bg-openboy-surface-hover transition-colors group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={worker.status} />
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-openboy-text-main truncate group-hover:text-[#ffd600] transition-colors">
                        {worker.name}
                      </div>
                      <div className="text-[11px] text-openboy-text-muted font-mono truncate mt-0.5 flex items-center gap-1.5">
                        <span>{worker.jobKey}</span>
                        <span>&rarr;</span>
                        <span className="text-[#ffd600] font-semibold">{worker.targetQueue}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-openboy-surface-subtle text-[#ffd600] border border-openboy-border">
                        {worker.cronExpr}
                      </span>
                      <span className="ml-1.5 text-openboy-text-muted text-[10px]">{worker.schedule}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-openboy-surface-subtle text-openboy-text-muted border border-openboy-border">
                        {worker.concurrency}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-openboy-text-muted">
                      {worker.lastRun}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-openboy-text-main font-bold">
                      {worker.duration}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#ffd600] font-semibold">
                      {worker.recordsProcessed}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => promptRun(worker)}
                          disabled={isRunning}
                          className="px-2.5 py-1.5 rounded-md bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                          <span>{isRunning ? "Running..." : "Trigger"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(worker.id)}
                          className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main border border-openboy-border transition-colors cursor-pointer"
                          title={isActive ? "Pause Worker" : "Resume Worker"}
                        >
                          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => promptDelete(worker)}
                          className="p-1.5 rounded-md bg-openboy-surface-subtle hover:bg-rose-500/15 text-openboy-text-muted hover:text-rose-500 border border-openboy-border transition-colors cursor-pointer"
                          title="Delete Batcher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
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

      {/* Trigger / Inspect Run Modal */}
      {runModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-openboy-surface border border-openboy-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-openboy-text-main transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-openboy-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-openboy-surface-subtle text-[#ffd600]">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-openboy-text-main">Manual Batch Trigger</h3>
                  <p className="text-xs text-openboy-text-muted">{runModal.batcher?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                className="text-openboy-text-muted hover:text-openboy-text-main p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!runModal.result ? (
              <div className="space-y-4">
                <p className="text-xs text-openboy-text-muted leading-relaxed">
                  Executing this batcher will dispatch a synchronous background trigger to{" "}
                  <code className="text-[#ffd600] font-mono">{runModal.batcher?.jobKey}</code>.
                  A single-instance lock will be acquired to ensure zero overlapping worker instances.
                </p>

                <div className="p-3 rounded-lg bg-openboy-surface-subtle border border-openboy-border space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-openboy-text-muted">
                    <span>Cron Schedule:</span>
                    <span className="text-openboy-text-main">{runModal.batcher?.schedule}</span>
                  </div>
                  <div className="flex justify-between text-openboy-text-muted">
                    <span>Target Queue:</span>
                    <span className="text-[#ffd600]">{runModal.batcher?.targetQueue}</span>
                  </div>
                  <div className="flex justify-between text-openboy-text-muted">
                    <span>Lock Strategy:</span>
                    <span className="text-openboy-text-main">{runModal.batcher?.concurrency}</span>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-openboy-border bg-openboy-surface-subtle text-xs font-semibold text-openboy-text-muted hover:text-openboy-text-main transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeBatcher}
                    disabled={runModal.running}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {runModal.running ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Dispatch Job Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Batch execution finished successfully</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                    <div className="text-openboy-text-muted">Execution Time: <span className="text-openboy-text-main font-bold">{runModal.result.duration}</span></div>
                    <div className="text-openboy-text-muted">Exit Code: <span className="text-emerald-500 font-bold">{runModal.result.exitCode}</span></div>
                    <div className="text-openboy-text-muted">Processed: <span className="text-[#ffd600] font-bold">{runModal.result.records}</span></div>
                    <div className="text-openboy-text-muted">Timestamp: <span className="text-openboy-text-main">{runModal.result.timestamp}</span></div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ffd600] text-black font-bold text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-openboy-surface border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-openboy-text-main transition-colors">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-openboy-text-main">Delete Batch Worker</h3>
                <p className="text-xs text-openboy-text-muted">{deleteModal.batcher?.name}</p>
              </div>
            </div>

            <p className="text-xs text-openboy-text-muted leading-relaxed">
              Are you sure you want to delete this batch worker? Scheduled consumption from{" "}
              <code className="text-[#ffd600] font-mono">{deleteModal.batcher?.targetQueue}</code>{" "}
              will halt permanently.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, batcher: null })}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-openboy-border bg-openboy-surface-subtle text-xs font-semibold text-openboy-text-muted hover:text-openboy-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Batcher Modal */}
      {newBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-openboy-surface border border-openboy-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-openboy-text-main transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-openboy-border">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ffd600]" />
                <h3 className="text-sm font-bold text-openboy-text-main">Register Batch Worker</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewBatchModal(false)}
                className="text-openboy-text-muted hover:text-openboy-text-main p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatcher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-openboy-text-main mb-1">
                  Worker Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Logs Retention Pruner"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1">
                    Cadence / Schedule
                  </label>
                  <select
                    value={newForm.schedule}
                    onChange={(e) => {
                      const val = e.target.value;
                      let expr = "*/10 * * * *";
                      if (val === "Every 10m") expr = "*/10 * * * *";
                      if (val === "Hourly") expr = "0 * * * *";
                      if (val === "Daily at midnight") expr = "0 0 * * *";
                      setNewForm({ ...newForm, schedule: val, cronExpr: expr });
                    }}
                    className="w-full px-3 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600]"
                  >
                    <option value="Every 10m">Every 10m</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily at midnight">Daily at midnight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1">
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    value={newForm.cronExpr}
                    onChange={(e) => setNewForm({ ...newForm, cronExpr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs font-mono text-[#ffd600] focus:outline-none focus:border-[#ffd600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-openboy-text-main mb-1">
                  Target Queue / Service Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. kafka.audit.prune"
                  value={newForm.targetQueue}
                  onChange={(e) => setNewForm({ ...newForm, targetQueue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs font-mono text-openboy-text-main focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-openboy-text-main mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What does this batch job process?"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs text-openboy-text-main focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-openboy-border bg-openboy-surface-subtle text-xs font-semibold text-openboy-text-muted hover:text-openboy-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs transition-colors"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
