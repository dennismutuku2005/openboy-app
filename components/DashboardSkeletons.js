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

export function TableSkeletonRows({ rows = 12 }) {
  return Array.from({ length: rows }).map((_, rIdx) => (
    <tr key={"skel-row-" + rIdx} className="border-b border-[#202615] animate-pulse">
      <td className="py-3.5 px-4">
        <div className="h-5 w-14 bg-[#28321b] rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-48 bg-[#26301a] rounded mb-1.5"></div>
        <div className="h-3 w-64 bg-[#1f2615] rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-10 bg-[#252e18] rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-12 bg-[#252e18] rounded"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-16 bg-[#28321b] rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-14 bg-[#212816] rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="h-4 w-14 bg-[#212816] rounded font-mono"></div>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 bg-[#242b18] rounded-md"></div>
          <div className="h-7 w-7 bg-[#242b18] rounded-md"></div>
          <div className="h-7 w-7 bg-[#242b18] rounded-md"></div>
        </div>
      </td>
    </tr>
  ));
}

export function TableSkeleton({ rows = 12, cols = 6 }) {
  return (
    <div className="rounded-xl border border-[#273019] bg-[#181c12] overflow-hidden animate-pulse">
      {/* Table Header */}
      <div className="p-4 border-b border-[#242b18] flex items-center justify-between gap-4 bg-[#14170e]">
        <div className="h-4 w-48 bg-[#252e18] rounded"></div>
        <div className="h-4 w-28 bg-[#202715] rounded"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#202615]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-4 w-12 bg-[#28321b] rounded"></div>
              <div className="h-4 w-48 bg-[#26301a] rounded"></div>
              <div className="h-3.5 w-32 bg-[#1f2615] rounded hidden sm:block"></div>
            </div>
            <div className="h-4 w-16 bg-[#28321b] rounded"></div>
            <div className="h-4 w-20 bg-[#212816] rounded font-mono"></div>
            <div className="h-7 w-20 bg-[#28321b] rounded-lg"></div>
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

      {/* Production Normalized Table Skeleton (12 items) */}
      <TableSkeleton rows={12} />
    </div>
  );
}
