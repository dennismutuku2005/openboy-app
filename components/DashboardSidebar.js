"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Clock,
  Activity,
  Heart,
  Settings,
  Plus,
  Zap,
  Layers,
  LogOut,
  User,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { monitors, logs, openCreateModal, logout, currentUser, setActiveFilter, activeFilter } = useDashboard();

  const mainNav = [
    { href: "/dashboard", label: "Schedules", icon: Clock },
    { href: "/dashboard/uptime", label: "Uptime", icon: Activity },
    { href: "/dashboard/heartbeats", label: "Heartbeats", icon: Heart },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const cadenceFilters = [
    { id: "10s", label: "10s High-Freq", icon: Zap, count: monitors.filter((m) => m.interval === "10s").length },
    { id: "30s", label: "30s Standard", icon: Clock, count: monitors.filter((m) => m.interval === "30s").length },
    { id: "10m", label: "10m Batchers", icon: Layers, count: monitors.filter((m) => m.interval === "10m").length },
  ];

  const errorCount = logs.filter((l) => !l.ok || (l.status && l.status >= 400)).length;

  return (
    <aside className="w-64 sm:w-72 bg-[#12150c] border-r border-[#242b18] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-30 select-none">
      {/* Top Section */}
      <div className="p-5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#1f2515] border border-[#343e23] flex items-center justify-center p-1.5 transition-all group-hover:border-[#ffd600]">
              <Image
                src="/logos/logo.png"
                alt="OpenBoy Logo"
                width={28}
                height={28}
                priority
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                OpenBoy
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block">
                Internal Console
              </span>
            </div>
          </Link>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
            v2.7
          </span>
        </div>

        {/* Primary Action: Create Monitor */}
        <div>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="w-full py-2.5 px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create monitor</span>
          </button>
        </div>

        {/* Core Navigation */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-3 block mb-2">
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#212716] text-[#ffd600] font-semibold border-l-2 border-[#ffd600]"
                    : "text-zinc-400 hover:text-white hover:bg-[#1a1e12]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#ffd600]" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.href === "/dashboard" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a331c] text-zinc-300 font-mono">
                    {monitors.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Cadences Quick Filters */}
        <div className="space-y-1 pt-2 border-t border-[#222816]">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-3 block mb-2">
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
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isFilterActive
                    ? "bg-[#28311a] text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#191d11]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#ffd600]" />
                  <span>{cadence.label}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {cadence.count}
                </span>
              </button>
            );
          })}

          {/* Errors indicator */}
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "failing" ? "all" : "failing")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer mt-1 ${
              activeFilter === "failing"
                ? "bg-rose-950/40 text-rose-300 font-semibold"
                : "text-zinc-400 hover:text-rose-300 hover:bg-[#191d11]"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Failing / Errors</span>
            </div>
            {errorCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        {/* Engine Cluster Status Box */}
        <div className="p-3 bg-[#181d10] border border-[#262f18] rounded-lg space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cron Dispatcher</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Engine Active"></span>
          </div>
          <div className="flex items-center justify-between font-mono text-zinc-400 text-[10px]">
            <span>Min Interval: 10s</span>
            <span>Batchers: 10m</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Operator Profile & Sign Out */}
      <div className="p-4 border-t border-[#222816] bg-[#10120a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#232a17] border border-[#343e22] flex items-center justify-center font-bold text-xs text-[#ffd600]">
              {(currentUser?.username || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.username || "admin"}
              </div>
              <div className="text-[10px] text-zinc-400">Internal Operator</div>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={logout}
            title="Sign out of OpenBoy"
            className="p-1.5 rounded-md hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
