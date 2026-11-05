"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useDashboard } from "./DashboardContext";

/**
 * Custom OpenBoy high-precision dual-ring spinner.
 * Pure SVG/CSS, silky smooth 60fps animation, zero external loader dependencies.
 */
function OpenBoyLoader({ size = "w-4 h-4", color = "text-[#ffd600]" }) {
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${size}`}>
      <svg
        className={`animate-spin ${size} ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-95"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
  );
}

export default function CreateMonitorModal() {
  const { isModalOpen, closeCreateModal, addMonitor, updateMonitor, modalInitialData } = useDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(modalInitialData?.id);

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [interval, setInterval] = useState("30s");
  const [customSeconds, setCustomSeconds] = useState(10);
  const [cronExpression, setCronExpression] = useState("*/5 * * * *");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [expectedStatus, setExpectedStatus] = useState("200");
  const [timeout, setTimeoutVal] = useState("30");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (modalInitialData) {
      setUrl(modalInitialData.url || "");
      setName(modalInitialData.name || "");
      setInterval(modalInitialData.interval || "30s");
      if (modalInitialData.intervalSeconds) {
        setCustomSeconds(modalInitialData.intervalSeconds);
      }
      if (modalInitialData.cronExpr) {
        setCronExpression(modalInitialData.cronExpr);
      }
      setMethod(modalInitialData.method || "GET");
      if (modalInitialData.expectedStatus) {
        setExpectedStatus(String(modalInitialData.expectedStatus));
      }
      if (modalInitialData.timeout) {
        setTimeoutVal(String(modalInitialData.timeout));
      }
      setBody(modalInitialData.body || "");
      if (modalInitialData.headers) {
        if (typeof modalInitialData.headers === "object") {
          setHeaders(JSON.stringify(modalInitialData.headers, null, 2));
        } else {
          setHeaders(String(modalInitialData.headers));
        }
      } else {
        setHeaders("");
      }
      if (
        modalInitialData.headers ||
        modalInitialData.body ||
        (modalInitialData.expectedStatus && modalInitialData.expectedStatus !== 200) ||
        (modalInitialData.timeout && modalInitialData.timeout !== 30)
      ) {
        setIsAdvancedOpen(true);
      } else {
        setIsAdvancedOpen(false);
      }
    } else {
      setUrl("");
      setName("");
      setInterval("30s");
      setCustomSeconds(10);
      setCronExpression("*/5 * * * *");
      setIsAdvancedOpen(false);
      setMethod("GET");
      setHeaders("");
      setBody("");
      setExpectedStatus("200");
      setTimeoutVal("30");
    }
  }, [modalInitialData, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    let intervalLabel = "Every 30 seconds";
    let intervalSec = 30;

    switch (interval) {
      case "10s":
        intervalLabel = "Every 10 seconds";
        intervalSec = 10;
        break;
      case "30s":
        intervalLabel = "Every 30 seconds";
        intervalSec = 30;
        break;
      case "1m":
        intervalLabel = "Every 1 minute";
        intervalSec = 60;
        break;
      case "5m":
        intervalLabel = "Every 5 minutes";
        intervalSec = 300;
        break;
      case "10m":
        intervalLabel = "Every 10 minutes";
        intervalSec = 600;
        break;
      case "30m":
        intervalLabel = "Every 30 minutes";
        intervalSec = 1800;
        break;
      case "1h":
        intervalLabel = "Every 1 hour";
        intervalSec = 3600;
        break;
      case "24h":
        intervalLabel = "Every 24 hours";
        intervalSec = 86400;
        break;
      case "custom_seconds":
        const sec = Math.max(10, parseInt(customSeconds) || 10);
        intervalLabel = `Every ${sec} seconds`;
        intervalSec = sec;
        break;
      case "cron":
        intervalLabel = `Custom Cron (${cronExpression || "* * * * *"})`;
        intervalSec = 300;
        break;
    }

    // Parse headers if provided
    let headersMap = {};
    if (headers && headers.trim()) {
      try {
        headersMap = JSON.parse(headers);
      } catch {
        headers.split("\n").forEach((line) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            headersMap[parts[0].trim()] = parts.slice(1).join(":").trim();
          }
        });
      }
    }

    const payload = {
      name: name.trim() || targetUrl.replace(/https?:\/\//, "").slice(0, 30),
      url: targetUrl,
      method: method,
      interval: interval,
      intervalSeconds: intervalSec,
      intervalLabel: intervalLabel,
      cronExpr: interval === "cron" ? cronExpression : "",
      category: intervalSec <= 60 ? "uptime" : "batcher",
      notifications: "defaults",
      headers: headersMap,
      body: body.trim() || "",
      expectedStatus: parseInt(expectedStatus) || 200,
      timeout: parseInt(timeout) || 30,
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateMonitor(modalInitialData.id, payload);
      } else {
        await addMonitor(payload);
      }
      closeCreateModal();
    } catch (err) {
      setError(err?.message || `Failed to ${isEditMode ? "update" : "create"} schedule. Please check your inputs.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-openboy-surface border border-openboy-border rounded-xl shadow-2xl overflow-hidden text-openboy-text-main transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-openboy-border">
          <div>
            <h2 className="text-base font-semibold text-openboy-text-main">
              {isEditMode ? "Edit schedule" : "Create schedule"}
            </h2>
            <p className="text-[11px] text-openboy-text-muted mt-0.5">
              {isEditMode
                ? "Update endpoint URL, execution cadence, timeout, or request parameters."
                : "Configure an automated high-frequency cron or health monitoring check."}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCreateModal}
            className="text-openboy-text-muted hover:text-openboy-text-main p-1.5 rounded-md hover:bg-openboy-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-500 font-medium animate-fade-in flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="text-rose-400 hover:text-rose-200 cursor-pointer">×</button>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-xs font-medium text-openboy-text-main mb-1.5">
              URL <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/health"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600] transition-colors placeholder:text-openboy-text-dim"
              />
            </div>
            <p className="text-[11px] text-openboy-text-muted mt-1">
              The endpoint OpenBoy will ping or trigger on the defined schedule.
            </p>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-openboy-text-main mb-1.5">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production API Ping or Hotspot Removal"
              className="w-full px-3.5 py-2.5 text-sm bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600] transition-colors placeholder:text-openboy-text-dim"
            />
          </div>

          {/* Cadence / Interval Dropdown */}
          <div>
            <label className="block text-xs font-medium text-openboy-text-main mb-1.5">
              Schedule Cadence <span className="text-amber-500">*</span>
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600] transition-colors cursor-pointer"
            >
              <option value="10s">Every 10 seconds (High-frequency)</option>
              <option value="30s">Every 30 seconds (Standard)</option>
              <option value="1m">Every 1 minute</option>
              <option value="5m">Every 5 minutes</option>
              <option value="10m">Every 10 minutes</option>
              <option value="30m">Every 30 minutes</option>
              <option value="1h">Every 1 hour</option>
              <option value="24h">Every 24 hours</option>
              <option value="custom_seconds">Custom Frequency (Seconds)</option>
              <option value="cron">Advanced Cron Expression</option>
            </select>
            <p className="text-[11px] text-openboy-text-muted mt-1">
              How often the scheduler dispatches HTTP probes.
            </p>
          </div>

          {/* Custom Seconds Input */}
          {interval === "custom_seconds" && (
            <div className="p-3 bg-openboy-surface-subtle border border-openboy-border rounded-lg space-y-2 animate-fade-in">
              <label className="block text-xs font-medium text-openboy-text-main">
                Custom Interval (Seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="86400"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  className="w-32 px-3 py-1.5 text-sm bg-openboy-surface text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600]"
                />
                <span className="text-xs text-openboy-text-muted">
                  seconds (Minimum 10s floor)
                </span>
              </div>
            </div>
          )}

          {/* Cron Expression Input */}
          {interval === "cron" && (
            <div className="p-3 bg-openboy-surface-subtle border border-openboy-border rounded-lg space-y-2 animate-fade-in">
              <label className="block text-xs font-medium text-openboy-text-main">
                Cron Expression (5-part)
              </label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="*/5 * * * *"
                className="w-full px-3 py-1.5 text-sm bg-openboy-surface text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] font-mono"
              />
              <p className="text-[11px] text-openboy-text-muted">
                Minute Hour DayOfMonth Month DayOfWeek (e.g., <code>*/10 * * * *</code> for every 10 mins).
              </p>
            </div>
          )}

          {/* Advanced Accordion Toggle */}
          <div className="border border-openboy-border rounded-lg overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between p-3 bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-xs font-medium text-openboy-text-main transition-colors cursor-pointer"
            >
              <span>Advanced HTTP Options (Method, Headers, Timeout)</span>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-openboy-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-openboy-text-muted" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-3 space-y-3 bg-openboy-surface border-t border-openboy-border animate-fade-in">
                {/* Method & Expected Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-openboy-text-muted mb-1">
                      HTTP Method
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600] cursor-pointer"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-openboy-text-muted mb-1">
                      Expected Status Code
                    </label>
                    <input
                      type="number"
                      value={expectedStatus}
                      onChange={(e) => setExpectedStatus(e.target.value)}
                      placeholder="200"
                      className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600]"
                    />
                  </div>
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-[11px] text-openboy-text-muted mb-1">
                    HTTP Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={timeout}
                    onChange={(e) => setTimeoutVal(e.target.value)}
                    placeholder="30"
                    className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600]"
                  />
                </div>

                {/* Headers */}
                <div>
                  <label className="block text-[11px] text-openboy-text-muted mb-1">
                    Headers (JSON or format Key: Value)
                  </label>
                  <textarea
                    rows={2}
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                    className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600] font-mono resize-none"
                  />
                </div>

                {/* Body if POST/PUT */}
                {["POST", "PUT", "PATCH"].includes(method) && (
                  <div>
                    <label className="block text-[11px] text-openboy-text-muted mb-1">
                      Request Body / Payload
                    </label>
                    <textarea
                      rows={2}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder='{"action": "cron_batch", "limit": 100}'
                      className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600] font-mono resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer / Symmetrical Side-by-Side Action Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg border border-openboy-border bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#ffd600] hover:bg-[#eed000] text-black text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isSubmitting && <OpenBoyLoader size="w-3.5 h-3.5" color="text-black" />}
              <span>
                {isSubmitting
                  ? isEditMode
                    ? "Saving changes..."
                    : "Creating schedule..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Schedule"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
