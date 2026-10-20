"use client";

import { useState } from "react";
import { Check, Copy, Sliders, Bell, Sparkles, Send } from "lucide-react";

export default function SettingsPage() {
  const [defaultInterval, setDefaultInterval] = useState("30s");
  const [timeoutThreshold, setTimeoutThreshold] = useState("10s");
  const [retryPolicy, setRetryPolicy] = useState("3");
  const [gracePeriod, setGracePeriod] = useState("60s");
  const [emailAlerts, setEmailAlerts] = useState("admin@openboy.dev");
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T00/B00/XXXX");
  const [pagerdutyKey, setPagerdutyKey] = useState("pd_live_routing_key_9941");
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const mcpConfig = `{
  "mcpServers": {
    "openboy": {
      "command": "npx",
      "args": ["-y", "@openboy/mcp-server"],
      "env": {
        "OPENBOY_API_KEY": "ob_live_8f99e3a07c1264b91"
      }
    }
  }
}`;

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopyMcp = () => {
    navigator.clipboard.writeText(mcpConfig);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const handleTestWebhook = () => {
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header (No icon next to title, matching design protocols) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242b18]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings & Integrations
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Internal scheduler defaults, alert webhooks, and AI editor MCP server configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
            Engine Configured
          </span>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System configuration and notification webhooks saved successfully.</span>
        </div>
      )}

      {/* Main Full-Width Grid (2 Columns across desktop, 1 on mobile) */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* CARD 1: Scheduler & Monitor Defaults */}
          <div className="bg-[#181c12] border border-[#273019] rounded-xl p-5 sm:p-6 shadow-lg space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#242b18]">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ffd600]" />
                  <span>Monitor & Scheduler Defaults</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Default parameters applied when creating new cron jobs and health checks.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Default Ping Interval
                  </label>
                  <select
                    value={defaultInterval}
                    onChange={(e) => setDefaultInterval(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer"
                  >
                    <option value="10s">10 Seconds (High-frequency ping)</option>
                    <option value="30s">30 Seconds (Standard default)</option>
                    <option value="1m">1 Minute (Standard heartbeat)</option>
                    <option value="10m">10 Minutes (Queue batcher default)</option>
                    <option value="1h">1 Hour (Hourly batch)</option>
                  </select>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Preselected cadence in the quick scheduler and modal wizard.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      HTTP Timeout Threshold
                    </label>
                    <select
                      value={timeoutThreshold}
                      onChange={(e) => setTimeoutThreshold(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                    >
                      <option value="5s">5 Seconds</option>
                      <option value="10s">10 Seconds (Recommended)</option>
                      <option value="30s">30 Seconds</option>
                      <option value="60s">60 Seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Retry Attempts on 5xx
                    </label>
                    <select
                      value={retryPolicy}
                      onChange={(e) => setRetryPolicy(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                    >
                      <option value="0">0 (Immediate Alert)</option>
                      <option value="1">1 Retry</option>
                      <option value="3">3 Retries (Backoff)</option>
                      <option value="5">5 Retries (Strict)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Downtime Grace Period
                  </label>
                  <select
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                  >
                    <option value="0s">0s (Instant Pager Notification)</option>
                    <option value="30s">30s (Brief Flap Suppression)</option>
                    <option value="60s">60s (Recommended Standard)</option>
                    <option value="5m">5m (Batch Resiliency)</option>
                  </select>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Duration a service may fail before dispatching on-call alerts.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Alert Destinations & Webhooks */}
          <div className="bg-[#181c12] border border-[#273019] rounded-xl p-5 sm:p-6 shadow-lg space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#242b18]">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#ffd600]" />
                  <span>Notification Webhooks & Escalations</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time destinations triggered when cron jobs fail or recovery occurs.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Emergency Alert Email
                  </label>
                  <input
                    type="email"
                    value={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] transition-colors"
                    placeholder="oncall@company.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Slack Webhook URL
                    </label>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="text-[11px] text-[#ffd600] hover:text-[#ffe55b] flex items-center gap-1 cursor-pointer font-mono disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingWebhook ? "Sending..." : testSuccess ? "Sent!" : "Test Ping"}</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] font-mono transition-colors"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  {testSuccess && (
                    <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                      ✓ Simulated 200 OK test alert dispatched to webhook channel.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    PagerDuty Integration Routing Key
                  </label>
                  <input
                    type="text"
                    value={pagerdutyKey}
                    onChange={(e) => setPagerdutyKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#12150c] text-white border border-[#273019] rounded-lg focus:outline-none focus:border-[#ffd600] font-mono transition-colors"
                    placeholder="pd_live_xxxx"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Events API v2 integration key for P1 downtime auto-escalations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: OpenBoy MCP Server for AI Editors (Full Width) */}
        <div className="bg-[#181c12] border border-[#273019] rounded-xl p-5 sm:p-6 shadow-lg space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242b18]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffd600]" />
                <span>OpenBoy Model Context Protocol (MCP) Server</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Connect your IDE assistant (Cursor, Windsurf, Claude Code) to inspect cron executions and trigger diagnostics directly from your prompt.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyMcp}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#273019] bg-[#14170e] hover:bg-[#1f2516] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-[#ffd600]" />
              <span>{copiedMcp ? "Copied JSON!" : "Copy Configuration"}</span>
            </button>
          </div>

          <div className="p-4 bg-[#12150c] border border-[#242b18] rounded-xl font-mono text-xs text-zinc-300 overflow-x-auto">
            <pre className="text-zinc-300 whitespace-pre leading-relaxed">{mcpConfig}</pre>
          </div>
        </div>

        {/* Save Settings Action Button (Full-width on phone, left-to-right) */}
        <div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-[0.99]"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
