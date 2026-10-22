"use client";

export function SkeletonBox({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-openboy-surface-hover rounded-lg ${className}`}
    />
  );
}

export function MetricCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl bg-openboy-surface border border-openboy-border space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-openboy-surface-hover rounded"></div>
            <div className="w-5 h-5 bg-openboy-surface-hover rounded-md"></div>
          </div>
          <div className="h-7 w-20 bg-openboy-border-light rounded"></div>
          <div className="h-3 w-32 bg-openboy-surface-hover rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function MonitorCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl bg-openboy-surface border border-openboy-border space-y-4 animate-pulse"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-12 bg-openboy-border-light rounded"></div>
                <div className="h-4 w-48 bg-openboy-border-light rounded"></div>
                <div className="h-4 w-12 bg-openboy-surface-hover rounded"></div>
                <div className="h-4 w-14 bg-openboy-surface-hover rounded"></div>
              </div>
              <div className="h-3.5 w-72 bg-openboy-surface-hover rounded font-mono"></div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-24 bg-openboy-border-light rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeletonRows({ rows = 12 }) {
  return Array.from({ length: rows }).map((_, rIdx) => (
    <tr key={"skel-row-" + rIdx} className="border-b border-openboy-border/60 animate-pulse">
      <td className="py-3.5 px-4">
        <div className="h-5 w-14 bg-openboy-border-light rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-48 bg-openboy-surface-hover rounded mb-1.5"></div>
        <div className="h-3 w-64 bg-openboy-border rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-10 bg-openboy-surface-hover rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-12 bg-openboy-surface-hover rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-16 bg-openboy-border-light rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-14 bg-openboy-surface-hover rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-14 bg-openboy-surface-hover rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 bg-openboy-surface-hover rounded-md"></div>
          <div className="h-7 w-7 bg-openboy-surface-hover rounded-md"></div>
          <div className="h-7 w-7 bg-openboy-surface-hover rounded-md"></div>
        </div>
      </td>
    </tr>
  ));
}

export function TableSkeleton({ rows = 12, cols = 6 }) {
  return (
    <div className="rounded-xl border border-openboy-border bg-openboy-surface overflow-hidden animate-pulse">
      {/* Table Header */}
      <div className="p-4 border-b border-openboy-border flex items-center justify-between gap-4 bg-openboy-surface-subtle">
        <div className="h-4 w-48 bg-openboy-surface-hover rounded"></div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-openboy-surface-hover rounded-lg"></div>
          <div className="h-7 w-28 bg-openboy-surface-hover rounded-lg"></div>
        </div>
      </div>

      {/* Rows */}
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-openboy-border/40">
            <div className="h-4 w-32 bg-openboy-surface-hover rounded"></div>
            <div className="h-4 w-24 bg-openboy-surface-hover rounded"></div>
            <div className="h-4 w-16 bg-openboy-border-light rounded"></div>
            <div className="h-4 w-20 bg-openboy-surface-hover rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-openboy-border animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-openboy-border-light rounded-lg"></div>
          <div className="h-3 w-80 bg-openboy-surface-hover rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-openboy-surface-hover rounded-lg"></div>
          <div className="h-9 w-28 bg-openboy-surface-hover rounded-lg"></div>
        </div>
      </div>

      {/* KPI Stats */}
      <MetricCardsSkeleton count={4} />

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-openboy-surface-hover rounded-md"></div>
          <div className="h-8 w-20 bg-openboy-surface-hover rounded-md"></div>
          <div className="h-8 w-24 bg-openboy-surface-hover rounded-md"></div>
        </div>
        <div className="h-8 w-64 bg-openboy-surface-hover rounded-lg"></div>
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={8} />
    </div>
  );
}
