"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Standardized PageHeader component ensuring uniform hierarchy and title protocols.
 */
export default function PageHeader({
  title,
  subtitle,
  badge,
  backLink,
  actions,
  className = "",
}) {
  return (
    <div className={`space-y-3 pb-2 border-b border-openboy-border ${className}`}>
      {backLink && (
        <div className="flex items-center">
          <Link
            href={backLink.href || "/dashboard"}
            className="inline-flex items-center gap-1.5 text-xs text-openboy-text-muted hover:text-openboy-text-main transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backLink.label || "Back"}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-openboy-text-main tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-openboy-text-muted mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
