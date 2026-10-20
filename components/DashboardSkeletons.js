"use client";

export function SkeletonBox({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[#1b2014] rounded-lg ${className}`}
    />
  );
}

export function MetricCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl bg-[#181c12] border border-[#273019] space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-[#232b17] rounded"></div>
            <div className="w-5 h-5 bg-[#232b17] rounded-md"></div>
          </div>
          <div className="h-7 w-20 bg-[#28321b] rounded"></div>
          <div className="h-3 w-32 bg-[#1f2615] rounded"></div>
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
          className="p-5 rounded-xl bg-[#181c12] border border-[#273019] space-y-4 animate-pulse"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-12 bg-[#28321b] rounded"></div>
                <div className="h-4 w-48 bg-[#28321b] rounded"></div>
                <div className="h-4 w-12 bg-[#212816] rounded"></div>
                <div className="h-4 w-14 bg-[#212816] rounded"></div>
              </div>
              <div className="h-3.5 w-72 bg-[#202715] rounded font-mono"></div>
              <div className="flex items-center gap-3 pt-1">
                <div className="h-3 w-28 bg-[#1e2514] rounded"></div>
                <div className="h-3 w-24 bg-[#1e2514] rounded"></div>
                <div className="h-3 w-20 bg-[#1e2514] rounded"></div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
              <div className="h-8 w-24 bg-[#28321b] rounded-lg"></div>
              <div className="h-8 w-8 bg-[#202715] rounded-lg"></div>
              <div className="h-8 w-8 bg-[#202715] rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden animate-pulse">
      {/* Table Header */}
      <div className="p-4 border-b border-[#242b18] flex items-center justify-between gap-4 bg-[#14170e]">
        <div className="h-4 w-36 bg-[#252e18] rounded"></div>
        <div className="h-4 w-24 bg-[#202715] rounded"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#202615]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-4 w-10 bg-[#28321b] rounded"></div>
              <div className="h-4 w-44 bg-[#26301a] rounded"></div>
              <div className="h-3.5 w-28 bg-[#1f2615] rounded hidden sm:block"></div>
            </div>
            <div className="h-4 w-16 bg-[#28321b] rounded"></div>
            <div className="h-4 w-20 bg-[#212816] rounded font-mono"></div>
            <div className="h-7 w-16 bg-[#28321b] rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#252c1a] animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-[#28321b] rounded"></div>
          <div className="h-3 w-64 bg-[#1f2615] rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-[#28321b] rounded-lg"></div>
          <div className="h-9 w-32 bg-[#ffd600]/30 rounded-lg"></div>
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-[#252c1a] pb-3 animate-pulse">
        <div className="h-8 w-28 bg-[#28321b] rounded-lg"></div>
        <div className="h-8 w-28 bg-[#1f2615] rounded-lg"></div>
        <div className="h-8 w-24 bg-[#1f2615] rounded-lg"></div>
        <div className="h-8 w-24 bg-[#1f2615] rounded-lg"></div>
      </div>

      {/* Monitor Cards Skeleton */}
      <MonitorCardsSkeleton count={4} />
    </div>
  );
}
