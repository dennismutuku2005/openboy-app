"use client";

import { useState } from "react";
import { Heart, Plus, Copy, Check, Terminal, ExternalLink, Zap } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";

export default function HeartbeatsPage() {
  const { openCreateModal } = useDashboard();
  const [copiedId, setCopiedId] = useState(null);

  const heartbeats = [
    {
      id: "hb-1",
      name: "Database Backup Worker",
      schedule: "Every 24 hours",
      expectedEvery: "86400s",
      gracePeriod: "30 mins",
      lastPing: "3 hours ago",
      status: "healthy",
      pingUrl: "https://openboy.app/ping/hb-9841f-db-backup",
    },
    {
      id: "hb-2",
      name: "10-Minute Billing Reconciliation Batcher",
      schedule: "Every 10 minutes",
      expectedEvery: "600s",
      gracePeriod: "2 mins",
      lastPing: "4 mins ago",
      status: "healthy",
      pingUrl: "https://openboy.app/ping/hb-10m-billing-sync",
    },
    {
      id: "hb-3",
      name: "30-Second Redis Cache Invalidation",
      schedule: "Every 30 seconds",
      expectedEvery: "30s",
      gracePeriod: "15s",
      lastPing: "Just now",
      status: "healthy",
      pingUrl: "https://openboy.app/ping/hb-30s-redis-cache",
    },
  ];

  const handleCopy = (url, id) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#ffd600]" />
            <span>Heartbeats & Batch Jobs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Dead Man&apos;s Snitches for your background cron workers and batchers. Ping OpenBoy when your jobs finish.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="px-3.5 py-2 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Heartbeat</span>
        </button>
      </div>

      {/* Heartbeats List */}
      <div className="space-y-4">
        {heartbeats.map((hb) => (
          <div
            key={hb.id}
            className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{hb.name}</h3>
                <span className="text-xs text-zinc-400">
                  Expected {hb.schedule} - Grace: {hb.gracePeriod}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                  Healthy
                </span>
                <span className="text-xs text-zinc-400 block mt-1">
                  Last ping: {hb.lastPing}
                </span>
              </div>
            </div>

            {/* Ping Endpoint Snippet */}
            <div className="p-3 bg-[#242918] border border-[#353e24] rounded-lg flex items-center justify-between gap-3 font-mono text-xs text-zinc-300 overflow-x-auto">
              <span className="truncate">curl {hb.pingUrl}</span>
              <button
                type="button"
                onClick={() => handleCopy(`curl ${hb.pingUrl}`, hb.id)}
                className="px-2.5 py-1 bg-[#1a1e12] hover:bg-[#202616] text-[#ffd600] border border-[#3e482b] rounded flex items-center gap-1 text-[11px] font-sans font-medium transition-colors shrink-0 cursor-pointer"
              >
                {copiedId === hb.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
