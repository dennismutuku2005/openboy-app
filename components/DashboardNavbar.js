"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search, Bell, LogOut, Terminal } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { openCreateModal, logout, currentUser, monitors } = useDashboard();

  const getPageTitle = () => {
    if (pathname === "/dashboard/uptime") return "Uptime SLA & Telemetry";
    if (pathname === "/dashboard/heartbeats") return "Heartbeats & Snitches";
    if (pathname === "/dashboard/settings") return "System Settings & MCP";
    return "Schedules & Cron Monitors";
  };

  return (
    <header className="w-full bg-[#14170e]/90 backdrop-blur-md border-b border-[#242b18] px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & Cluster Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-500">console</span>
          <span className="text-zinc-600">/</span>
          <span className="text-white font-medium">{getPageTitle()}</span>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c2214] text-zinc-300 border border-[#2b351e]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>CLUSTER: PROD-INTERNAL</span>
        </span>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="px-3 py-1.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Cron</span>
        </button>

        <button
          type="button"
          onClick={logout}
          title="Sign out of internal console"
          className="p-1.5 rounded-md hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
