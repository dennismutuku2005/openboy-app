"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function PingResultModal() {
  const { pingResultDialog, closePingResultDialog } = useDashboard();

  if (!pingResultDialog.isOpen || !pingResultDialog.result) return null;
  const res = pingResultDialog.result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                res.ok
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {res.ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-openboy-text-main">Execution Result</h3>
              <p className="text-xs text-openboy-text-muted mt-0.5">Manual test ping completed</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePingResultDialog}
            className="p-1 rounded-md text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Metrics Box */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-openboy-surface-subtle border border-openboy-border rounded-xl text-center">
          <div>
            <span className="text-xs text-openboy-text-muted block mb-0.5 font-medium">HTTP Status</span>
            <span
              className={`font-mono text-sm font-bold ${
                res.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {res.status || 500} {res.statusText}
            </span>
          </div>

          <div>
            <span className="text-xs text-openboy-text-muted block mb-0.5 font-medium">Latency</span>
            <span className="font-mono text-sm font-bold text-[#ffd600]">
              {res.latency}ms
            </span>
          </div>

          <div>
            <span className="text-xs text-openboy-text-muted block mb-0.5 font-medium">Executed At</span>
            <span className="font-mono text-xs text-openboy-text-main">
              {res.timestamp}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-openboy-text-muted font-medium block mb-1">Target Endpoint:</span>
            <div className="p-2.5 bg-openboy-surface-subtle border border-openboy-border rounded-lg font-mono text-openboy-text-main truncate">
              {res.method} {res.url}
            </div>
          </div>

          {res.error && (
            <div>
              <span className="text-rose-500 dark:text-rose-400 font-medium block mb-1">Failure Trace:</span>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg font-mono text-rose-600 dark:text-rose-300 text-[11px] leading-relaxed">
                {res.error}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={closePingResultDialog}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
