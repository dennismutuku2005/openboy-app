"use client";

/**
 * Reusable MetricCard component for KPI and telemetry summary dashboards.
 * Replaces repetitive card code across Schedules, Executions, Uptime, Incidents, and Batchers.
 */
export default function MetricCard({
  title,
  label,
  value,
  icon: Icon,
  subtitle,
  trend,
  trendType = "neutral",
  valueColor = "",
  badge,
  className = "",
  onClick,
}) {
  const displayTitle = title || label;

  const trendColorClass = {
    success: "text-emerald-500 dark:text-emerald-400",
    danger: "text-rose-500 dark:text-rose-400",
    warning: "text-amber-500 dark:text-amber-400",
    neutral: "text-openboy-text-muted",
  }[trendType] || "text-openboy-text-muted";

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-openboy-surface border border-openboy-border rounded-xl p-4 sm:p-4.5 shadow-xs transition-all duration-200 text-left w-full flex flex-col justify-between ${
        onClick ? "hover:border-[#ffd600]/60 hover:shadow-md cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 text-openboy-text-muted">
          <span className="text-xs font-mono font-medium truncate">{displayTitle}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-openboy-surface-subtle border border-openboy-border text-openboy-text-muted">
                {badge}
              </span>
            )}
            {Icon && <Icon className="w-4 h-4 text-openboy-text-dim" />}
          </div>
        </div>

        <div
          className={`text-2xl sm:text-[26px] font-bold font-mono tracking-tight mt-1.5 ${
            valueColor || "text-openboy-text-main"
          }`}
        >
          {value}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 pt-2 border-t border-openboy-border/60 flex items-center justify-between text-[11px] text-openboy-text-muted">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span className={`font-mono font-semibold ml-auto flex items-center gap-1 ${trendColorClass}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </Component>
  );
}
