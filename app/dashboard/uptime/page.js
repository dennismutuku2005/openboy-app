"use client";

import { useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";

export default function UptimePage() {
  const { monitors } = useDashboard();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Uptime & Latency Metrics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global heartbeat telemetry and response latency across all active monitors.
          </p>
        </div>

        {/* Global SLA Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f2615] border border-[#2e3720]">
          <Activity className="w-4 h-4 text-[#ffd600]" />
          <span className="text-xs font-semibold text-white">System Status:</span>
          <span className="text-xs font-bold text-emerald-400">99.98% Operational</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Monitors</span>
          <div className="text-2xl font-bold text-white">{monitors.length}</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {monitors.filter((m) => m.status === "active").length} active now
          </span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Avg. Response Time</span>
          <div className="text-2xl font-bold text-[#ffd600]">44ms</div>
          <span className="text-[11px] text-zinc-400">
            Across 10s and 30s checks
          </span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Incident Rate (24h)</span>
          <div className="text-2xl font-bold text-white">0.02%</div>
          <span className="text-[11px] text-emerald-400">Zero downtime events</span>
        </div>

        <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-4 space-y-1">
          <span className="text-xs text-zinc-400">Total Pings Handled</span>
          <div className="text-2xl font-bold text-white">28,490</div>
          <span className="text-[11px] text-zinc-400">Automatic cron cycles</span>
        </div>
      </div>

      {/* Per-Monitor Uptime Bars */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Monitor Health Breakdown</h2>

        <div className="space-y-4">
          {monitors.map((mon) => (
            <div
              key={mon.id}
              className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{mon.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{mon.url}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 block">
                    {mon.uptime || "100%"}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase">
                    {mon.intervalLabel}
                  </span>
                </div>
              </div>

              {/* 30-Day mini uptime bars visualization */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>30 days ago</span>
                  <span className="text-emerald-400 font-medium">100% Uptime</span>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1 h-6">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const isFailingDay = mon.status === "failing" && i === 28;
                    return (
                      <div
                        key={i}
                        title={`Day ${i + 1}: ${isFailingDay ? "Incident (503 Error)" : "100% Operational"}`}
                        className={`flex-1 h-full rounded-xs transition-colors hover:opacity-80 cursor-pointer ${
                          isFailingDay ? "bg-rose-500" : "bg-emerald-500/80"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
