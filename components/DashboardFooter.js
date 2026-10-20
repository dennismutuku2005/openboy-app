"use client";

export default function DashboardFooter() {
  return (
    <footer className="w-full py-4 px-6 border-t border-[#232918] bg-[#12150c] text-[11px] text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>OpenBoy Internal Cron Engine &bull; System Operational</span>
      </div>
      <div>
        Infrastructure Node: us-east-internal-01 &bull; v2.7.1
      </div>
    </footer>
  );
}
