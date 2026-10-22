"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function DeleteConfirmModal() {
  const { deleteDialog, closeDeleteDialog, confirmDelete } = useDashboard();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!deleteDialog.isOpen || !deleteDialog.monitor) return null;

  const handleConfirm = () => {
    setIsDeleting(true);
    setTimeout(() => {
      confirmDelete();
      setIsDeleting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-openboy-surface border border-openboy-border rounded-2xl shadow-2xl overflow-hidden p-6 text-openboy-text-main space-y-5 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-openboy-text-main">Delete monitor</h3>
              <p className="text-xs text-openboy-text-muted mt-0.5">This action cannot be undone.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDeleteDialog}
            className="p-1 rounded-md text-openboy-text-muted hover:text-openboy-text-main hover:bg-openboy-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-openboy-surface-subtle border border-openboy-border rounded-xl space-y-1 font-mono text-xs">
          <div className="font-semibold text-openboy-text-main truncate">
            {deleteDialog.monitor.name}
          </div>
          <div className="text-openboy-text-muted truncate text-[11px]">
            {deleteDialog.monitor.url}
          </div>
          <div className="text-openboy-text-dim text-[11px] pt-1 font-sans">
            Interval: {deleteDialog.monitor.intervalLabel}
          </div>
        </div>

        <p className="text-xs text-openboy-text-muted leading-relaxed">
          Are you sure you want to remove this monitor? All scheduled execution runs, latency history, and uptime logs will be permanently deleted.
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={closeDeleteDialog}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-muted hover:text-openboy-text-main border border-openboy-border transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isDeleting ? "Deleting..." : "Delete monitor"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
