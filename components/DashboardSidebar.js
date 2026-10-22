"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Clock,
  Activity,
  Settings,
  Plus,
  Zap,
  Layers,
  AlertTriangle,
  History,
  ShieldAlert,
  Server,
  Loader2,
  X,
  User,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const {
    monitors,
    logs,
    openCreateModal,
    logout,
    currentUser,
    setActiveFilter,
    activeFilter,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useDashboard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Professional cron system core pages
  const mainNav = [
    { href: "/dashboard", label: "Schedules", icon: Clock },
    { href: "/dashboard/executions", label: "Executions", icon: History },
    { href: "/dashboard/uptime", label: "Uptime SLA", icon: Activity },
    { href: "/dashboard/batchers", label: "Batchers", icon: Server },
    { href: "/dashboard/incidents", label: "Incidents", icon: ShieldAlert },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const cadenceFilters = [
    { id: "10s", label: "10s High-Freq", icon: Zap, count: monitors.filter((m) => m.interval === "10s").length },
    { id: "30s", label: "30s Standard", icon: Clock, count: monitors.filter((m) => m.interval === "30s").length },
    { id: "10m", label: "10m Batchers", icon: Layers, count: monitors.filter((m) => m.interval === "10m").length },
  ];

  const errorCount = logs.filter((l) => !l.ok || (l.status && l.status >= 400)).length;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
    }, 350);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-openboy-surface border-r border-openboy-border flex flex-col justify-between h-screen overflow-y-auto select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-30 md:shrink-0 md:sticky md:top-0 md:w-64 sm:md:w-72 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Section */}
        <div className="p-5 space-y-6">
          {/* Centered Logo with mobile close button */}
          <div className="pt-2 pb-1 flex items-center justify-between md:justify-center w-full">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center justify-center transition-transform hover:scale-105"
              title="OpenBoy Internal Console"
            >
              <Image
                src="/logos/logo.png"
                alt="OpenBoy Logo"
                width={56}
                height={56}
                priority
                className="object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 text-openboy-text-muted hover:text-openboy-text-main md:hidden cursor-pointer transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Action Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                openCreateModal();
                setIsMobileSidebarOpen(false);
              }}
              className="w-full py-3.5 px-6 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create monitor</span>
            </button>
          </div>

          {/* Core Navigation */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-openboy-text-dim px-3 block mb-2 uppercase tracking-wider">
              Navigation
            </span>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-openboy-surface-hover text-[#ffd600] font-semibold border-l-2 border-[#ffd600] shadow-2xs"
                      : "text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#ffd600]" : "text-openboy-text-dim"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.href === "/dashboard" && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-openboy-surface-subtle text-openboy-text-muted font-mono border border-openboy-border">
                      {monitors.length}
                    </span>
                  )}
                  {item.href === "/dashboard/incidents" && errorCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 dark:text-rose-300 font-mono font-bold">
                      {errorCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Cadences Filters */}
          <div className="space-y-1 pt-3 border-t border-openboy-border">
            <span className="text-xs font-semibold text-openboy-text-dim px-3 block mb-2 uppercase tracking-wider">
              Cron Cadences
            </span>
            {cadenceFilters.map((cadence) => {
              const Icon = cadence.icon;
              const isFilterActive = activeFilter === cadence.id;

              return (
                <button
                  key={cadence.id}
                  type="button"
                  onClick={() => setActiveFilter(isFilterActive ? "all" : cadence.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isFilterActive
                      ? "bg-openboy-surface-hover text-openboy-text-main font-semibold border border-openboy-border"
                      : "text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-[#ffd600]" />
                    <span>{cadence.label}</span>
                  </div>
                  <span className="text-xs font-mono text-openboy-text-dim">
                    {cadence.count}
                  </span>
                </button>
              );
            })}

            {/* Failing filter */}
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "failing" ? "all" : "failing")}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer mt-1 ${
                activeFilter === "failing"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 font-semibold border border-rose-500/30"
                  : "text-openboy-text-muted hover:text-rose-500 hover:bg-openboy-surface-hover"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Failing / Errors</span>
              </div>
              {errorCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 dark:text-rose-300 font-bold">
                  {errorCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Section: Operator Profile & Logout */}
        <div className="p-4 border-t border-openboy-border bg-openboy-surface-subtle space-y-3">

          <Link
            href="/dashboard/profile"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center gap-3 p-1.5 -m-1.5 rounded-lg hover:bg-openboy-surface-hover transition-colors cursor-pointer group"
            title="Manage Operator Profile & Security"
          >
            <div className="w-9 h-9 rounded-full bg-openboy-surface border border-openboy-border group-hover:border-[#ffd600] flex items-center justify-center font-bold text-sm text-[#ffd600] transition-colors shadow-2xs">
              {(currentUser?.name || currentUser?.username || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-openboy-text-main truncate group-hover:text-[#ffd600] transition-colors">
                {currentUser?.name || currentUser?.username || "admin"}
              </div>
              <div className="text-xs text-openboy-text-muted truncate">
                {currentUser?.email || "Account"}
              </div>
            </div>
          </Link>

          {/* Clean Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-4 rounded-lg border border-openboy-border bg-openboy-surface hover:bg-rose-500/10 text-openboy-text-muted hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center text-xs font-semibold disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#ffd600]" />
            ) : (
              <span>Sign out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
