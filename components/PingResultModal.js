"use client";

import { CheckCircle2, XCircle, X, Clock, Globe, ArrowRight } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function PingResultModal() {
  const { pingResultDialog, closePingResultDialog } = useDashboard();

  if (!pingResultDialog.isOpen || !pingResultDialog.result) return null;
  const res = pingResultDialog.result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#181d11] border border-[#2d3620] rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                res.ok
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {res.ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Execution Result</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Manual test ping completed</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePingResultDialog}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#232a18] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Metrics Box */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#12150c] border border-[#242b18] rounded-xl text-center">
          <div>
            <span className="text-xs text-zinc-400 block mb-0.5">HTTP Status</span>
            <span
              className={`font-mono text-sm font-bold ${
                res.ok ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {res.status || 500} {res.statusText}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block mb-0.5">Latency</span>
            <span className="font-mono text-sm font-bold text-[#ffd600]">
              {res.latency}ms
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block mb-0.5">Executed At</span>
            <span className="font-mono text-xs text-zinc-300">
              {res.timestamp}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-zinc-400 font-medium block mb-1">Target Endpoint:</span>
            <div className="p-2.5 bg-[#12150c] border border-[#242b18] rounded-lg font-mono text-zinc-200 truncate">
              {res.method} {res.url}
            </div>
          </div>

          {res.error && (
            <div>
              <span className="text-rose-400 font-medium block mb-1">Failure Trace:</span>
              <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg font-mono text-rose-300 text-[11px] leading-relaxed">
                {res.error}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={closePingResultDialog}
            className="px-4 py-2 bg-[#ffd600] hover:bg-[#eed000] text-black font-semibold text-xs rounded-lg transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
