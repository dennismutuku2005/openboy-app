"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Clock, Loader2, Menu } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { openCreateModal, monitors, setIsMobileSidebarOpen, currentUser } = useDashboard();
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

  const activeCount = monitors.filter((m) => m.status === "active").length;
  const userInitial = (currentUser?.name || currentUser?.username || "A").slice(0, 1).toUpperCase();
  const currentSection = pathname.replace("/dashboard", "").replace("/", "") || "schedules";

  const handleOpenCreate = () => {
    setIsCreating(true);
    openCreateModal();
    setTimeout(() => setIsCreating(false), 300);
  };

  return (
    <header className="w-full bg-[#12150c]/95 backdrop-blur-md border-b border-[#242b18] px-4 sm:px-8 py-3 sm:py-3.5 min-h-[56px] sm:min-h-[64px] flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 transition-all">
      {/* Mobile Top Row: Standalone sidebar toggle, Breadcrumb & Profile Avatar */}
      <div className="flex md:hidden items-center justify-between w-full">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="text-[#ffd600] hover:text-[#eed000] p-1.5 -ml-1.5 cursor-pointer transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Mobile Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <span className="text-zinc-500">openboy</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-200 font-semibold px-2 py-0.5 rounded bg-[#181d11] border border-[#273019] capitalize">
            {currentSection}
          </span>
        </div>

        {/* Mobile Profile Avatar */}
        <Link
          href="/dashboard/profile"
          className="p-1 rounded-full hover:ring-2 hover:ring-[#ffd600]/40 transition-all cursor-pointer group"
          title="Open Profile & Account Security"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#232a17] border border-[#ffd600]/40 group-hover:border-[#ffd600] group-hover:scale-105 flex items-center justify-center font-bold text-xs text-[#ffd600] transition-all shadow-xs">
              {userInitial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-[#12150c] rounded-full" />
          </div>
        </Link>
      </div>

      {/* Desktop Breadcrumbs (No duplicate page title) */}
      <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400">
        <span className="text-zinc-500">openboy</span>
        <span className="text-zinc-600">/</span>
        <span className="text-[#ffd600] font-medium">console</span>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-200 font-semibold px-2.5 py-1 rounded-md bg-[#181d11] border border-[#273019] text-[11px] tracking-wide capitalize">
          {currentSection}
        </span>
      </div>

      {/* Right: Operational Status, Live UTC Clock, Primary Action Button & Desktop Profile Avatar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {/* Cluster Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#181c12] border border-[#273019] text-xs font-mono text-zinc-300">
            <span className="text-zinc-400">Engine:</span>
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
        </div>

        {/* Substantial Action Button: full-width on mobile running left to right */}
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isCreating}
          className="w-full sm:w-auto py-2.5 px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-black" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          )}
          <span>New Cron</span>
        </button>

        {/* Desktop Profile Avatar */}
        <div className="hidden md:flex items-center pl-1 border-l border-[#242b18]">
          <Link
            href="/dashboard/profile"
            className="p-1 rounded-full hover:ring-2 hover:ring-[#ffd600]/40 transition-all cursor-pointer group"
            title="Operator Profile & Security"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#232a17] border border-[#ffd600]/40 group-hover:border-[#ffd600] group-hover:scale-105 flex items-center justify-center font-bold text-xs text-[#ffd600] transition-all shadow-xs">
                {userInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-[#12150c] rounded-full" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
