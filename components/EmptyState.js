"use client";

import { Plus } from "lucide-react";

/**
 * Standardized EmptyState placeholder component when queries or tables have no results.
 */
export default function EmptyState({
  icon: Icon,
  title = "No items found",
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`border-l-2 border-[#ffd600] pl-5 py-6 space-y-3 bg-openboy-surface rounded-r-xl border border-l-2 border-openboy-border p-6 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-openboy-surface-subtle border border-openboy-border flex items-center justify-center text-openboy-text-muted shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-openboy-text-main">{title}</h3>
          {description && (
            <p className="text-xs text-openboy-text-muted max-w-lg leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="pt-2">
          {typeof action === "function" ? (
            action()
          ) : action.label ? (
            <button
              type="button"
              onClick={action.onClick}
              className="px-4 py-2 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            >
              <span>{action.label}</span>
              {action.icon ? <action.icon className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
