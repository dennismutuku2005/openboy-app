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
  Database,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Sliders,
  Terminal,
  Cpu,
  X,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";
import { TableSkeletonRows, MetricCardsSkeleton } from "@/components/DashboardSkeletons";

const initialBatchers = [
  {
    id: "batch-1",
    name: "Analytics Event Ingestion Batcher",
    jobKey: "events_ingest_10m",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Mutex Locked",
    lastRun: "3 minutes ago",
    duration: "4.2s",
    recordsProcessed: "18,420 events",
    targetQueue: "kafka.events.raw",
    description: "Flushes buffer pool into ClickHouse cold-storage partition every 10 minutes.",
  },
  {
    id: "batch-2",
    name: "Dead-Letter Queue (DLQ) Auto-Replayer",
    jobKey: "webhook_dlq_replay",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Strict FIFO",
    lastRun: "8 minutes ago",
    duration: "1.8s",
    recordsProcessed: "42 retries",
    targetQueue: "sqs.webhooks.dlq",
    description: "Consumes rejected customer webhook events with exponential backoff.",
  },
  {
    id: "batch-3",
    name: "Postgres Vacuum & Statistics Analyzer",
    jobKey: "pg_vacuum_analyze",
    schedule: "Daily at 03:00 UTC",
    cronExpr: "0 3 * * *",
    status: "active",
    concurrency: "Leader Node Only",
    lastRun: "8 hours ago",
    duration: "142.1s",
    recordsProcessed: "1.2M dead tuples",
    targetQueue: "rds.primary.pg16",
    description: "Runs VACUUM ANALYZE across high-write audit log tables to prevent bloat.",
  },
  {
    id: "batch-4",
    name: "Stripe Billing Cycle Reconciliation",
    jobKey: "stripe_reconciliation",
    schedule: "Hourly at :00",
    cronExpr: "0 * * * *",
    status: "paused",
    concurrency: "Single Instance",
    lastRun: "Yesterday",
    duration: "18.6s",
    recordsProcessed: "2,100 subscriptions",
    targetQueue: "stripe.webhook.ledger",
    description: "Validates subscription states against internal tenant entitlement stores.",
  },
  {
    id: "batch-5",
    name: "S3 Cold Storage Snapshot Archive",
    jobKey: "s3_glacier_archiver",
    schedule: "Every 6 hours",
    cronExpr: "0 */6 * * *",
    status: "active",
    concurrency: "Worker Pool (x4)",
    lastRun: "2 hours ago",
    duration: "44.7s",
    recordsProcessed: "3.4 GB compressed",
    targetQueue: "s3://openboy-telemetry-archive",
    description: "Packs logs older than 7 days into parquet format and pushes to Glacier Deep Archive.",
  },
  {
    id: "batch-6",
    name: "Customer Usage Rollup Aggregator",
    jobKey: "usage_rollup_10m",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Mutex Locked",
    lastRun: "1 minute ago",
    duration: "3.1s",
    recordsProcessed: "84,000 metrics",
    targetQueue: "metrics.usage.in",
    description: "Computes 10-minute rollup sums for API meter consumption.",
  },
  {
    id: "batch-7",
    name: "Expired JWT Session Purger",
    jobKey: "jwt_session_prune",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Single Instance",
    lastRun: "5 minutes ago",
    duration: "0.9s",
    recordsProcessed: "140 sessions",
    targetQueue: "redis.sessions.cleanup",
    description: "Removes invalidated auth tokens and revokes idle sessions.",
  },
  {
    id: "batch-8",
    name: "Audit Log Hash Chain Notarizer",
    jobKey: "audit_hash_notarize",
    schedule: "Hourly at :30",
    cronExpr: "30 * * * *",
    status: "active",
    concurrency: "Leader Node Only",
    lastRun: "35 minutes ago",
    duration: "6.4s",
    recordsProcessed: "4,800 records",
    targetQueue: "ledger.audit.immutable",
    description: "Generates cryptographic SHA-256 Merkle root over hourly audit trail.",
  },
  {
    id: "batch-9",
    name: "Intercom Contact Attribution Sync",
    jobKey: "intercom_attribution_sync",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Rate-limited Pool",
    lastRun: "9 minutes ago",
    duration: "2.4s",
    recordsProcessed: "65 contacts",
    targetQueue: "integrations.crm.intercom",
    description: "Syncs customer tier upgrades to support CRM pipeline.",
  },
  {
    id: "batch-10",
    name: "Temporary Uploads Bucket Sweeper",
    jobKey: "tmp_uploads_sweep",
    schedule: "Daily at 04:00 UTC",
    cronExpr: "0 4 * * *",
    status: "active",
    concurrency: "Strict FIFO",
    lastRun: "7 hours ago",
    duration: "12.3s",
    recordsProcessed: "450 files deleted",
    targetQueue: "s3://openboy-tmp-uploads",
    description: "Deletes multipart uploads abandoned for more than 24 hours.",
  },
  {
    id: "batch-11",
    name: "Algolia Search Primary Sync",
    jobKey: "algolia_primary_sync",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Mutex Locked",
    lastRun: "4 minutes ago",
    duration: "5.1s",
    recordsProcessed: "1,200 entities",
    targetQueue: "search.algolia.delta",
    description: "Flushes database mutation changelog into search index.",
  },
  {
    id: "batch-12",
    name: "Kubernetes Orphaned Volume Pruner",
    jobKey: "k8s_pv_pruner",
    schedule: "Daily at 05:00 UTC",
    cronExpr: "0 5 * * *",
    status: "paused",
    concurrency: "Leader Node Only",
    lastRun: "Yesterday",
    duration: "15.8s",
    recordsProcessed: "0 volumes",
    targetQueue: "k8s.csi.volumes",
    description: "Scans for released PVC storage volumes and unmounts EBS disks.",
  },
  {
    id: "batch-13",
    name: "Stripe Invoice Finalization Dispatcher",
    jobKey: "stripe_invoice_finalize",
    schedule: "Daily at 01:00 UTC",
    cronExpr: "0 1 * * *",
    status: "active",
    concurrency: "Strict FIFO",
    lastRun: "10 hours ago",
    duration: "24.5s",
    recordsProcessed: "310 invoices",
    targetQueue: "billing.invoices.finalize",
    description: "Finalizes draft monthly subscriptions and dispatches payment intents.",
  },
  {
    id: "batch-14",
    name: "Webhook Endpoint Health Prober",
    jobKey: "webhook_endpoint_probe",
    schedule: "Every 10m",
    cronExpr: "*/10 * * * *",
    status: "active",
    concurrency: "Worker Pool (x8)",
    lastRun: "2 minutes ago",
    duration: "1.2s",
    recordsProcessed: "52 endpoints",
    targetQueue: "webhooks.health.probe",
    description: "Probes customer target webhook endpoints for DNS or TLS errors.",
  },
];

export default function BatchersPage() {
  const { isLoadingAuth } = useDashboard();
  const [batchers, setBatchers] = useState(initialBatchers);
  const [runningJobId, setRunningJobId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered batchers list
  const filteredBatchers = batchers.filter((b) => {
    if (filter === "active" && b.status !== "active") return false;
    if (filter === "paused" && b.status !== "paused") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.jobKey.toLowerCase().includes(q) ||
        b.targetQueue.toLowerCase().includes(q) ||
        b.schedule.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Infinite Load: 12 per load (Automatic on scroll)
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

  const toggleStatus = (id) => {
    setBatchers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: b.status === "active" ? "paused" : "active" } : b))
    );
  };

  const promptRun = (batcher) => {
    setRunModal({ isOpen: true, batcher, running: false, result: null });
  };

  const executeBatcher = () => {
    if (!runModal.batcher) return;
    setRunModal((prev) => ({ ...prev, running: true }));
    setRunningJobId(runModal.batcher.id);

    setTimeout(() => {
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
          b.id === runModal.batcher.id
            ? {
                ...b,
                lastRun: "Just now",
                duration,
                recordsProcessed: `${records.toLocaleString()} items`,
              }
            : b
        )
      );
    }, 1200);
  };

  const promptDelete = (batcher) => {
    setDeleteModal({ isOpen: true, batcher });
  };

  const confirmDelete = () => {
    if (deleteModal.batcher) {
      setBatchers((prev) => prev.filter((b) => b.id !== deleteModal.batcher.id));
    }
    setDeleteModal({ isOpen: false, batcher: null });
  };

  const handleCreateBatcher = (e) => {
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

    setBatchers([newWorker, ...batchers]);
    setNewBatchModal(false);
    setNewForm({
      name: "",
      jobKey: "",
      schedule: "Every 10m",
      cronExpr: "*/10 * * * *",
      targetQueue: "",
      description: "",
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#28321b] rounded animate-pulse"></div>
        <MetricCardsSkeleton count={4} />
        <div className="h-64 bg-[#181c12] rounded-xl border border-[#273019] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header (No icon next to title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242b18]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Batch Workers
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Normalized production table for 10-minute queue consumers, background sync jobs, and database ETL batchers.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setNewBatchModal(true)}
            className="w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register Batcher</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid (Phone responsive 2x2 grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Total Workers</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{batchers.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Configured in scheduler</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Active Workers</span>
            <CheckCircle2 className="w-4 h-4 text-[#ffd600]" />
          </div>
          <div className="text-2xl font-bold text-[#ffd600] font-mono">
            {batchers.filter((b) => b.status === "active").length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Consuming on schedule</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Standard Interval</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">10m</div>
          <div className="text-[11px] text-zinc-500 mt-1">Default batch consumption</div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c12] border border-[#273019]">
          <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
            <span>Cluster Mutex</span>
            <Cpu className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">Locked</div>
          <div className="text-[11px] text-emerald-400 mt-1">Zero race conditions</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242b18] pb-3">
        {/* Mobile Filter Dropdown (Full width left to right) */}
        <div className="sm:hidden w-full">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#181c12] border border-[#28321b] text-white text-xs rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:border-[#ffd600] cursor-pointer"
          >
            <option value="all">All Workers ({batchers.length})</option>
            <option value="active">Active ({batchers.filter((b) => b.status === "active").length})</option>
            <option value="paused">Paused ({batchers.filter((b) => b.status === "paused").length})</option>
          </select>
        </div>

        {/* Desktop Filter Tabs */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-[#27301a] text-[#ffd600] font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-[#181c12]"
            }`}
          >
            All Workers ({batchers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "active"
                ? "bg-[#27301a] text-[#ffd600] font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-[#181c12]"
            }`}
          >
            Active ({batchers.filter((b) => b.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("paused")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === "paused"
                ? "bg-[#27301a] text-[#ffd600] font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-[#181c12]"
            }`}
          >
            Paused ({batchers.filter((b) => b.status === "paused").length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search batchers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 sm:py-1.5 rounded-lg bg-[#181c12] border border-[#28321b] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffd600] w-full"
          />
        </div>
      </div>

      {/* NORMALIZED HIGH-DENSITY BATCHERS TABLE WITH INFINITE SCROLL */}
      <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead className="bg-[#12150c] text-zinc-400 font-mono border-b border-[#242b18]">
              <tr>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Batch Worker / Queue Target</th>
                <th className="py-3 px-4 font-semibold">Cron Schedule</th>
                <th className="py-3 px-4 font-semibold">Concurrency Lock</th>
                <th className="py-3 px-4 font-semibold">Last Run</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Processed</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202615]">
              {filteredBatchers.slice(0, visibleCount).map((worker) => {
                const isRunning = runningJobId === worker.id;
                const isActive = worker.status === "active";

                return (
                  <tr
                    key={worker.id}
                    className="hover:bg-[#1f2516] transition-colors group"
                  >
                    {/* Status Badge (Zero dots, clean rectangular tag) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-[#252c19] text-zinc-400 border-[#384328]"
                        }`}
                      >
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </td>

                    {/* Worker Name & Target Queue */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-white truncate group-hover:text-[#ffd600] transition-colors">
                        {worker.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate mt-0.5 flex items-center gap-1.5">
                        <span className="text-zinc-500">{worker.jobKey}</span>
                        <span className="text-zinc-600">&rarr;</span>
                        <span className="text-[#ffd600]">{worker.targetQueue}</span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#202715] text-[#ffd600] border border-[#2d371d]">
                        {worker.cronExpr}
                      </span>
                      <span className="ml-1.5 text-zinc-400 text-[10px]">{worker.schedule}</span>
                    </td>

                    {/* Concurrency */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#1e2414] text-zinc-300 border border-[#2b351e]">
                        {worker.concurrency}
                      </span>
                    </td>

                    {/* Last Run */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-zinc-400">
                      {worker.lastRun}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-white font-bold">
                      {worker.duration}
                    </td>

                    {/* Records Processed */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#ffd600]">
                      {worker.recordsProcessed}
                    </td>

                    {/* Action Buttons with Spinners */}
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
                          className="p-1.5 rounded-md bg-[#212716] hover:bg-[#2b341f] text-zinc-300 hover:text-white border border-[#2e371f] transition-colors cursor-pointer"
                          title={isActive ? "Pause Worker" : "Resume Worker"}
                        >
                          {isActive ? <Pause className="w-3.5 h-3.5 text-zinc-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => promptDelete(worker)}
                          className="p-1.5 rounded-md bg-[#212716] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-[#2e371f] transition-colors cursor-pointer"
                          title="Delete Batcher"
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
                  rows={Math.min(12, Math.max(1, filteredBatchers.length - visibleCount))}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Invisible sentinel for automatic infinite scroll */}
        {hasMore && <div ref={loadSentinelRef} className="h-4 w-full pointer-events-none" />}
      </div>

      {/* Trigger / Inspect Run Modal */}
      {runModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181c12] border border-[#2f391e] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#273019]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#252d19] text-[#ffd600]">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manual Batch Trigger</h3>
                  <p className="text-xs text-zinc-400">{runModal.batcher?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                className="text-zinc-500 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!runModal.result ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Executing this batcher will dispatch a synchronous background trigger to{" "}
                  <code className="text-[#ffd600] font-mono">{runModal.batcher?.jobKey}</code>.
                  A single-instance lock will be acquired to ensure zero overlapping worker instances.
                </p>

                <div className="p-3 rounded-lg bg-[#12150c] border border-[#222816] space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Cron Schedule:</span>
                    <span className="text-white">{runModal.batcher?.schedule}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Target Queue:</span>
                    <span className="text-[#ffd600]">{runModal.batcher?.targetQueue}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Lock Strategy:</span>
                    <span className="text-zinc-300">{runModal.batcher?.concurrency}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                    className="px-4 py-2 rounded-lg border border-[#2b351e] bg-[#14170e] text-xs font-semibold text-zinc-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeBatcher}
                    disabled={runModal.running}
                    className="px-5 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs flex items-center gap-2 disabled:opacity-50"
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
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Batch execution finished successfully</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                    <div className="text-zinc-400">Execution Time: <span className="text-white font-bold">{runModal.result.duration}</span></div>
                    <div className="text-zinc-400">Exit Code: <span className="text-emerald-400 font-bold">{runModal.result.exitCode}</span></div>
                    <div className="text-zinc-400">Processed: <span className="text-[#ffd600] font-bold">{runModal.result.records}</span></div>
                    <div className="text-zinc-400">Timestamp: <span className="text-white">{runModal.result.timestamp}</span></div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRunModal({ isOpen: false, batcher: null, running: false, result: null })}
                    className="px-5 py-2 rounded-lg bg-[#ffd600] text-black font-bold text-xs"
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
          <div className="bg-[#181c12] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Batch Worker</h3>
                <p className="text-xs text-zinc-400">{deleteModal.batcher?.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete this batch worker? Scheduled consumption from{" "}
              <code className="text-[#ffd600] font-mono">{deleteModal.batcher?.targetQueue}</code>{" "}
              will halt permanently.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, batcher: null })}
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

      {/* Register Batcher Modal */}
      {newBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181c12] border border-[#2f391e] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#273019]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ffd600]" />
                <h3 className="text-sm font-bold text-white">Register Batch Worker</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewBatchModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatcher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Worker Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Logs Retention Pruner"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12150c] border border-[#2c371d] text-xs text-white focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                    className="w-full px-3 py-2.5 rounded-lg bg-[#12150c] border border-[#2c371d] text-xs text-white focus:outline-none focus:border-[#ffd600]"
                  >
                    <option value="Every 10m">Every 10m</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily at midnight">Daily at midnight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    value={newForm.cronExpr}
                    onChange={(e) => setNewForm({ ...newForm, cronExpr: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#12150c] border border-[#2c371d] text-xs font-mono text-[#ffd600] focus:outline-none focus:border-[#ffd600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Target Queue / Service Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. kafka.audit.prune"
                  value={newForm.targetQueue}
                  onChange={(e) => setNewForm({ ...newForm, targetQueue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#12150c] border border-[#2c371d] text-xs font-mono text-white focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What does this batch job process?"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#12150c] border border-[#2c371d] text-xs text-white focus:outline-none focus:border-[#ffd600]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2b351e] bg-[#14170e] text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs"
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
