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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#12150c] border-r border-[#242b18] flex flex-col justify-between h-screen overflow-y-auto select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-30 md:shrink-0 md:sticky md:top-0 md:w-64 sm:md:w-72 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Section */}
        <div className="p-5 space-y-6">
          {/* Centered Logo with mobile close button */}
          <div className="pt-2 pb-1 flex items-center justify-between md:justify-center w-full">
            <div className="md:hidden w-8" />
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
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f2615] md:hidden cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Primary Action Button: Exact size and style of the Login Button */}
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

        {/* Core Navigation for a Professional Cron System */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-zinc-400 px-3 block mb-2">
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
                    ? "bg-[#212716] text-[#ffd600] font-semibold border-l-2 border-[#ffd600]"
                    : "text-zinc-400 hover:text-white hover:bg-[#1a1e12]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#ffd600]" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.href === "/dashboard" && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#2a331c] text-zinc-300 font-mono">
                    {monitors.length}
                  </span>
                )}
                {item.href === "/dashboard/incidents" && errorCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                    {errorCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Cadences Filters */}
        <div className="space-y-1 pt-3 border-t border-[#222816]">
          <span className="text-xs font-semibold text-zinc-400 px-3 block mb-2">
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
                    ? "bg-[#28311a] text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#191d11]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-[#ffd600]" />
                  <span>{cadence.label}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
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
                ? "bg-rose-950/40 text-rose-300 font-semibold"
                : "text-zinc-400 hover:text-rose-300 hover:bg-[#191d11]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Failing / Errors</span>
            </div>
            {errorCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                {errorCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Section: Operator Profile & Clean Text-Only Logout Button */}
      <div className="p-4 border-t border-[#222816] bg-[#10120a] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#232a17] border border-[#343e22] flex items-center justify-center font-bold text-sm text-[#ffd600]">
            {(currentUser?.username || "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser?.username || "admin"}
            </div>
            <div className="text-xs text-zinc-400">Operator</div>
          </div>
        </div>

        {/* Dedicated Logout Button: Clean text-only without icon, with spinner when clicked */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full py-2.5 px-4 rounded-lg border border-[#2b351e] bg-[#181c12] hover:bg-rose-950/40 text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer flex items-center justify-center text-xs font-semibold disabled:opacity-60"
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
