"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Clock, Loader2, Menu } from "lucide-react";
import { useDashboard } from "./DashboardContext";
import ThemeToggle from "./ThemeToggle";

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
    <header className="w-full bg-openboy-surface/95 backdrop-blur-md border-b border-openboy-border px-4 sm:px-8 py-3 sm:py-3.5 min-h-[56px] sm:min-h-[64px] flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 transition-all">
      {/* Mobile Top Row: Standalone sidebar toggle, Breadcrumb, Theme Toggle & Profile Avatar */}
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
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-openboy-text-muted">
          <span className="text-openboy-text-dim">openboy</span>
          <span className="text-openboy-border-light">/</span>
          <span className="text-openboy-text-main font-medium capitalize">
            {currentSection}
          </span>
        </div>

        {/* Mobile Right: Theme toggle & Avatar */}
        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Link
            href="/dashboard/profile"
            className="p-1 rounded-full hover:ring-2 hover:ring-[#ffd600]/40 transition-all cursor-pointer group"
            title="Open Profile & Account Security"
          >
            <div className="relative">
              <div suppressHydrationWarning className="w-8 h-8 rounded-full bg-openboy-surface-subtle border border-[#ffd600]/40 group-hover:border-[#ffd600] group-hover:scale-105 flex items-center justify-center font-bold text-xs text-[#ffd600] transition-all shadow-xs">
                {userInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-openboy-surface rounded-full" />
            </div>
          </Link>
        </div>
      </div>

      {/* Desktop Breadcrumbs (No duplicate page title) */}
      <div className="hidden md:flex items-center gap-2 text-xs font-mono text-openboy-text-muted">
        <span className="text-openboy-text-dim">openboy</span>
        <span className="text-openboy-border-light">/</span>
        <span className="text-[#ffd600] font-medium">console</span>
        <span className="text-openboy-border-light">/</span>
        <span className="text-openboy-text-main font-medium capitalize">
          {currentSection}
        </span>
      </div>

      {/* Right: Operational Status, Live UTC Clock, Theme Toggle, Primary Action Button & Desktop Profile Avatar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {/* Cluster Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs font-mono text-openboy-text-main">
            <span className="text-openboy-text-muted">Engine:</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Online</span>
          </div>

          {/* Live Clock */}
          {utcTime && (
            <div suppressHydrationWarning className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs font-mono text-openboy-text-muted">
              <Clock className="w-3.5 h-3.5 text-openboy-text-dim" />
              <span>{utcTime}</span>
            </div>
          )}

          {/* Active Monitors Counter */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-openboy-surface-subtle border border-openboy-border text-xs font-mono">
            <span className="text-openboy-text-muted text-[11px] sm:text-xs">Active:</span>
            <span className="text-[#ffd600] font-bold text-[11px] sm:text-xs">{activeCount}</span>
            <span className="text-openboy-border-light text-[11px] sm:text-xs">/</span>
            <span className="text-openboy-text-muted text-[11px] sm:text-xs">{monitors.length}</span>
          </div>
        </div>

        {/* Theme Toggle Button (Desktop) */}
        <div className="hidden md:flex items-center">
          <ThemeToggle variant="compact" />
        </div>

        {/* Substantial Action Button */}
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isCreating}
          className="w-full sm:w-auto py-2.5 px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-black" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          )}
          <span>New Cron</span>
        </button>

        {/* Desktop Profile Avatar */}
        <div className="hidden md:flex items-center pl-1 border-l border-openboy-border">
          <Link
            href="/dashboard/profile"
            className="p-1 rounded-full hover:ring-2 hover:ring-[#ffd600]/40 transition-all cursor-pointer group"
            title="Operator Profile & Security"
          >
            <div className="relative">
              <div suppressHydrationWarning className="w-8 h-8 rounded-full bg-openboy-surface-subtle border border-[#ffd600]/40 group-hover:border-[#ffd600] group-hover:scale-105 flex items-center justify-center font-bold text-xs text-[#ffd600] transition-all shadow-xs">
                {userInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-openboy-surface rounded-full" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
