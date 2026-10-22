"use client";

import { Zap, Clock, Layers } from "lucide-react";

/**
 * Cadence badge representing cron interval frequency (10s, 30s, 10m, custom cron).
 */
export default function IntervalBadge({
  interval,
  label,
  showIcon = false,
  className = "",
}) {
  const norm = String(interval || "").toLowerCase();
  const displayLabel = label || interval;

  let badgeStyle = "bg-openboy-surface-subtle text-openboy-text-main border-openboy-border";
  let Icon = Clock;

  if (norm.includes("10s") || norm.includes("10 sec")) {
    badgeStyle = "bg-[#ffd600]/15 text-[#e6b800] dark:text-[#ffd600] border-[#ffd600]/40";
    Icon = Zap;
  } else if (norm.includes("10m") || norm.includes("10 min")) {
    badgeStyle = "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    Icon = Layers;
  } else if (norm.includes("cron") || norm.includes("*")) {
    badgeStyle = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
    Icon = Clock;
  }

  return (
    <span
      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 whitespace-nowrap ${badgeStyle} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );
}
