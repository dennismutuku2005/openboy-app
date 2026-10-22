"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useDashboard } from "./DashboardContext";

export default function CreateMonitorModal() {
  const { isModalOpen, closeCreateModal, addMonitor, modalInitialData } = useDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [timeout, setTimeoutVal] = useState("10");

  useEffect(() => {
    if (modalInitialData) {
      if (modalInitialData.url) setUrl(modalInitialData.url);
      if (modalInitialData.name) setName(modalInitialData.name);
      if (modalInitialData.interval) setInterval(modalInitialData.interval);
      if (modalInitialData.method) setMethod(modalInitialData.method);
    } else {
      setUrl("");
      setName("");
      setInterval("30s");
      setCustomSeconds(10);
      setIsAdvancedOpen(false);
      setMethod("GET");
    }
  }, [modalInitialData, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

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

    const newMonitor = {
      id: "mon-" + Date.now(),
      name: name.trim() || targetUrl.replace(/https?:\/\//, "").slice(0, 30),
      url: targetUrl,
      method: method,
      interval: interval,
      intervalSeconds: intervalSec,
      intervalLabel: intervalLabel,
      status: "active",
      lastStatus: 200,
      lastLatency: Math.floor(Math.random() * 40) + 20,
      lastChecked: "Just created",
      uptime: "100%",
      notifications: [],
      category: intervalSec <= 60 ? "uptime" : "batcher",
      expectedStatus: parseInt(expectedStatus) || 200,
      timeout: parseInt(timeout) || 10,
      totalPings: 1,
      failedPings: 0,
      history: [
        { status: 200, latency: 32, time: "Just now", ok: true },
      ],
    };

    setIsSubmitting(true);
    setTimeout(() => {
      addMonitor(newMonitor);
      setIsSubmitting(false);
      closeCreateModal();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-openboy-surface border border-openboy-border rounded-xl shadow-2xl overflow-hidden text-openboy-text-main transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-openboy-border">
          <h2 className="text-base font-semibold text-openboy-text-main">
            Create monitor
          </h2>
          <button
            type="button"
            onClick={closeCreateModal}
            className="text-openboy-text-muted hover:text-openboy-text-main p-1 rounded-md hover:bg-openboy-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
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
              The endpoint OpenBoy will ping or trigger as a cron job.
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
              placeholder="e.g. Production API Ping or Billing Webhook"
              className="w-full px-3.5 py-2.5 text-sm bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600] transition-colors placeholder:text-openboy-text-dim"
            />
          </div>

          {/* Interval Select */}
          <div>
            <label className="block text-xs font-medium text-openboy-text-main mb-1.5">
              Interval
            </label>
            <div className="relative">
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-md focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600] transition-colors appearance-none cursor-pointer pr-10"
              >
                <option value="10s">
                  Every 10 seconds (Minimum interval)
                </option>
                <option value="30s">
                  Every 30 seconds (Standard default)
                </option>
                <option value="1m">
                  Every 1 minute
                </option>
                <option value="5m">
                  Every 5 minutes
                </option>
                <option value="10m">
                  Every 10 minutes (Batcher standard)
                </option>
                <option value="30m">
                  Every 30 minutes
                </option>
                <option value="1h">
                  Every 1 hour
                </option>
                <option value="24h">
                  Every 24 hours
                </option>
                <option value="custom_seconds">
                  Custom interval in seconds (Min 10s)
                </option>
                <option value="cron">
                  Custom cron expression
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-openboy-text-muted">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Conditional Custom Interval Input */}
          {interval === "custom_seconds" && (
            <div className="p-3 bg-openboy-surface-subtle border border-openboy-border rounded-md animate-fade-in">
              <label className="block text-xs font-medium text-openboy-text-main mb-1">
                Interval in Seconds (Least 10 seconds):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="86400"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-32 px-3 py-1.5 text-sm bg-openboy-surface text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600]"
                />
                <span className="text-xs text-openboy-text-muted">seconds (e.g. 15s, 45s)</span>
              </div>
            </div>
          )}

          {interval === "cron" && (
            <div className="p-3 bg-openboy-surface-subtle border border-openboy-border rounded-md animate-fade-in">
              <label className="block text-xs font-medium text-openboy-text-main mb-1">
                Cron Expression (Standard 5-fields):
              </label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="*/10 * * * *"
                className="w-full px-3 py-1.5 text-sm bg-openboy-surface text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600] font-mono"
              />
              <span className="text-[11px] text-openboy-text-muted mt-1 block">
                Example: &quot;*/10 * * * *&quot; (every 10 mins), &quot;0 23 * * *&quot; (daily at 23:00)
              </span>
            </div>
          )}

          {/* Advanced Accordion */}
          <div className="border border-openboy-border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-openboy-surface-subtle text-xs font-medium text-openboy-text-main hover:bg-openboy-surface-hover transition-colors cursor-pointer"
            >
              <span>Advanced HTTP Options</span>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-openboy-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-openboy-text-muted" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-3.5 bg-openboy-surface space-y-3 border-t border-openboy-border">
                {/* Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-openboy-text-muted mb-1">
                      Method
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded focus:outline-none focus:border-[#ffd600]"
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

          {/* Modal Footer / Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : null}
              <span>{isSubmitting ? "Creating monitor..." : "Add monitor"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
