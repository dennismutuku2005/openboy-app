"use client";

/**
 * Standardized StatusBadge component with high contrast in both dark and light modes.
 * Adheres to zero-dot design guidelines while providing instant visual status recognition.
 */
export default function StatusBadge({
  status,
  label,
  size = "sm",
  showDot = false,
  className = "",
}) {
  const norm = String(status || "").toLowerCase().trim();

  // Status style mapping
  let styleClasses = "bg-openboy-surface-subtle text-openboy-text-muted border-openboy-border";
  let dotColor = "bg-zinc-400";
  let displayLabel = label;

  if (
    norm === "active" ||
    norm === "online" ||
    norm === "operational" ||
    norm === "resolved" ||
    norm === "success" ||
    norm === "ok" ||
    norm === "200" ||
    norm === "leader node only" ||
    norm === "mutex locked"
  ) {
    styleClasses = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    dotColor = "bg-emerald-500";
    if (!displayLabel) {
      if (norm === "200") displayLabel = "200 OK";
      else if (norm === "active") displayLabel = "Active";
      else if (norm === "resolved") displayLabel = "Resolved";
      else displayLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  } else if (
    norm === "failing" ||
    norm === "error" ||
    norm === "outage" ||
    norm === "critical" ||
    norm === "p1" ||
    norm.startsWith("p1") ||
    norm === "500" ||
    norm === "502" ||
    norm === "503" ||
    norm === "504"
  ) {
    styleClasses = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    dotColor = "bg-rose-500";
    if (!displayLabel) {
      if (norm === "failing") displayLabel = "Failing";
      else if (norm.startsWith("p1")) displayLabel = "P1 - Critical";
      else displayLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  } else if (
    norm === "investigating" ||
    norm === "warning" ||
    norm === "degraded" ||
    norm === "p2" ||
    norm.startsWith("p2") ||
    norm.startsWith("4")
  ) {
    styleClasses = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    dotColor = "bg-amber-500";
    if (!displayLabel) {
      if (norm.startsWith("p2")) displayLabel = "P2 - High";
      else if (norm === "investigating") displayLabel = "Investigating";
      else displayLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  } else if (
    norm === "paused" ||
    norm === "disabled" ||
    norm === "strict fifo" ||
    norm === "single instance"
  ) {
    styleClasses = "bg-openboy-surface-subtle text-openboy-text-muted border-openboy-border";
    dotColor = "bg-zinc-400";
    if (!displayLabel) {
      displayLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  } else if (norm === "p3" || norm.startsWith("p3") || norm === "moderate" || norm === "info") {
    styleClasses = "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30";
    dotColor = "bg-sky-500";
    if (!displayLabel) {
      if (norm.startsWith("p3")) displayLabel = "P3 - Moderate";
      else displayLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  } else {
    displayLabel = displayLabel || String(status);
  }

  const sizeClass = size === "md"
    ? "text-[11px] px-2.5 py-1"
    : "text-[10px] px-2 py-0.5";

  return (
    <span
      className={`font-mono font-bold rounded border inline-flex items-center gap-1.5 whitespace-nowrap tracking-wide select-none ${sizeClass} ${styleClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{displayLabel}</span>
    </span>
  );
}
