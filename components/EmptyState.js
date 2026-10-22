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
      className={`w-full bg-openboy-surface border border-openboy-border rounded-2xl py-12 px-6 sm:px-8 text-center flex flex-col items-center justify-center shadow-xs transition-all ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-openboy-surface-subtle border border-openboy-border flex items-center justify-center text-openboy-text-muted mb-3.5 shadow-2xs">
          <Icon className="w-5 h-5 text-[#ffd600]" />
        </div>
      )}

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-openboy-text-main tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-openboy-text-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-5 flex items-center justify-center">
          {typeof action === "function" ? (
            action()
          ) : action.label ? (
            <button
              type="button"
              onClick={action.onClick}
              className="px-5 py-2.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            >
              <span>{action.label}</span>
              {action.icon ? (
                <action.icon className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
