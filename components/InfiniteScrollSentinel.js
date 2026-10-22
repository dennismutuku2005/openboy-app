"use client";

import { Loader2 } from "lucide-react";

/**
 * Standardized InfiniteScrollSentinel component for table / feed pagination.
 * Maintains fixed height to eliminate all layout shifts, shaking, and scroll jumping.
 */
export default function InfiniteScrollSentinel({
  sentinelRef,
  hasMore,
  isLoadingMore,
  label = "Loading more records...",
  className = "",
}) {
  if (!hasMore) return null;

  return (
    <div
      ref={sentinelRef}
      className={`py-4 flex items-center justify-center text-xs text-openboy-text-muted font-mono gap-2 min-h-[48px] select-none ${className}`}
    >
      {isLoadingMore ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-[#ffd600]" />
          <span>{label}</span>
        </>
      ) : (
        <span className="opacity-0 pointer-events-none">Scroll to load more</span>
      )}
    </div>
  );
}
