"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Clock, Activity, Loader2, Sparkles, Terminal, Menu } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { openCreateModal, monitors, setIsMobileSidebarOpen } = useDashboard();
  const [utcTime, setUtcTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toTimeString().split(" ")[0] + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageInfo = () => {
    if (pathname === "/dashboard/executions") {
      return {
        title: "Executions & History",
        subtitle: "Audit trail, live cron dispatch timeline, and payload inspection",
      };
    }
    if (pathname === "/dashboard/uptime") {
      return {
        title: "Uptime SLA & Telemetry",
        subtitle: "Global availability metrics, latency distributions, and health bars",
      };
    }
    if (pathname === "/dashboard/batchers") {
      return {
        title: "Batch Workers",
        subtitle: "10-minute queue consumers, background sync workers, and heavy batchers",
      };
    }
    if (pathname === "/dashboard/incidents") {
      return {
        title: "Incidents & Downtime Alarms",
        subtitle: "Real-time failure escalations, service outages, and post-mortem logs",
      };
    }
    if (pathname === "/dashboard/settings") {
      return {
        title: "Settings & Integrations",
        subtitle: "Internal scheduler defaults, alert webhooks, and MCP access tokens",
      };
    }
    return {
      title: "Cron Schedules",
      subtitle: "Active high-frequency monitors, batchers, and automated health checks",
    };
  };

  const info = getPageInfo();
  const activeCount = monitors.filter((m) => m.status === "active").length;

  const handleOpenCreate = () => {
    setIsCreating(true);
    openCreateModal();
    setTimeout(() => setIsCreating(false), 300);
  };

  return (
    <header className="w-full bg-[#12150c]/95 backdrop-blur-md border-b border-[#242b18] px-4 sm:px-8 py-3.5 sm:py-5 min-h-[64px] sm:min-h-[82px] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20 transition-all">
      {/* Left: Mobile menu toggle + Breadcrumbs & prominent section title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 -ml-1 rounded-lg text-zinc-300 hover:text-white bg-[#181c12] border border-[#28321b] md:hidden cursor-pointer shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5 text-[#ffd600]" />
        </button>

        <div className="flex flex-col justify-center space-y-0.5 sm:space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-zinc-400 truncate">
            <span className="text-zinc-500">openboy</span>
            <span className="text-zinc-600">/</span>
            <span className="text-[#ffd600] font-medium">console</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300 truncate">{pathname.replace("/dashboard", "").replace("/", "") || "schedules"}</span>
          </div>

          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl md:text-[22px] font-bold text-white tracking-tight">
              {info.title}
            </h1>
            <span className="text-xs text-zinc-400 hidden lg:inline-block">
              {info.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Status, Live UTC Clock & Primary Action Button */}
      <div className="flex items-center gap-2 sm:gap-3 self-end md:self-center flex-wrap">
        {/* Cluster Status Badge */}
        <div className="hidden xs:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#181c12] border border-[#273019] text-xs font-mono text-zinc-300">
          <span className="text-zinc-400 hidden sm:inline">Engine:</span>
          <span className="text-emerald-400 font-semibold">Online</span>
        </div>

        {/* Live Clock */}
        {utcTime && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c12] border border-[#273019] text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{utcTime}</span>
          </div>
        )}

        {/* Active Monitors Counter */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#181c12] border border-[#273019] text-xs font-mono">
          <span className="text-zinc-400 text-[11px] sm:text-xs">Active:</span>
          <span className="text-[#ffd600] font-bold text-[11px] sm:text-xs">{activeCount}</span>
          <span className="text-zinc-600 text-[11px] sm:text-xs">/</span>
          <span className="text-zinc-400 text-[11px] sm:text-xs">{monitors.length}</span>
        </div>

        {/* Substantial Action Button matching design system */}
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isCreating}
          className="py-1.5 sm:py-2.5 px-3 sm:px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-black" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          )}
          <span>New Cron</span>
        </button>
      </div>
    </header>
  );
}
