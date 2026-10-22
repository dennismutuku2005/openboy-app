"use client";

import { useState } from "react";
import { Check, Copy, Sliders, Bell, Sparkles, Send, Palette } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";

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
      {/* Unified Page Header */}
      <PageHeader
        title="Settings & Integrations"
        subtitle="Internal scheduler defaults, alert webhooks, appearance preferences, and AI editor MCP server configuration."
      />

      {saved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>System configuration and notification webhooks saved successfully.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* CARD: Appearance & Theme Toggle */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>
                  <Palette className="w-4 h-4 text-[#ffd600]" />
                  <span>Appearance & Workspace Theme</span>
                </CardTitle>
                <CardDescription>
                  Switch between OpenBoy&apos;s signature Dark Olive console and clean high-contrast Light mode.
                </CardDescription>
              </div>
              <ThemeToggle variant="segmented" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-openboy-border bg-openboy-surface-subtle space-y-1.5">
                <span className="font-semibold text-openboy-text-main flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffd600]" />
                  <span>Dark Olive Theme (Signature)</span>
                </span>
                <p className="text-openboy-text-muted leading-relaxed text-[11px]">
                  Military-grade low-glare dark console designed for NOC operations, long terminal sessions, and high-frequency dispatch monitoring.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-openboy-border bg-openboy-surface-subtle space-y-1.5">
                <span className="font-semibold text-openboy-text-main flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Light Clean Theme (High-Contrast)</span>
                </span>
                <p className="text-openboy-text-muted leading-relaxed text-[11px]">
                  Pristine alabaster palette with crisp borders, razor-sharp typography, and elevated daylight legibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* CARD 1: Scheduler & Monitor Defaults */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>
                  <Sliders className="w-4 h-4 text-[#ffd600]" />
                  <span>Monitor & Scheduler Defaults</span>
                </CardTitle>
                <CardDescription>
                  Default parameters applied when creating new cron jobs and health checks.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                    Default Ping Interval
                  </label>
                  <select
                    value={defaultInterval}
                    onChange={(e) => setDefaultInterval(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer"
                  >
                    <option value="10s">10 Seconds (High-frequency ping)</option>
                    <option value="30s">30 Seconds (Standard default)</option>
                    <option value="1m">1 Minute (Standard heartbeat)</option>
                    <option value="10m">10 Minutes (Queue batcher default)</option>
                    <option value="1h">1 Hour (Hourly batch)</option>
                  </select>
                  <span className="text-[11px] text-openboy-text-muted mt-1 block">
                    Preselected cadence in the quick scheduler and modal wizard.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                      HTTP Timeout Threshold
                    </label>
                    <select
                      value={timeoutThreshold}
                      onChange={(e) => setTimeoutThreshold(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                    >
                      <option value="5s">5 Seconds</option>
                      <option value="10s">10 Seconds (Recommended)</option>
                      <option value="30s">30 Seconds</option>
                      <option value="60s">60 Seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                      Retry Attempts on 5xx
                    </label>
                    <select
                      value={retryPolicy}
                      onChange={(e) => setRetryPolicy(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                    >
                      <option value="0">0 (Immediate Alert)</option>
                      <option value="1">1 Retry</option>
                      <option value="3">3 Retries (Backoff)</option>
                      <option value="5">5 Retries (Strict)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                    Downtime Grace Period
                  </label>
                  <select
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] cursor-pointer font-mono"
                  >
                    <option value="0s">0s (Instant Pager Notification)</option>
                    <option value="30s">30s (Brief Flap Suppression)</option>
                    <option value="60s">60s (Recommended Standard)</option>
                    <option value="5m">5m (Batch Resiliency)</option>
                  </select>
                  <span className="text-[11px] text-openboy-text-muted mt-1 block">
                    Duration a service may fail before dispatching on-call alerts.
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* CARD 2: Alert Destinations & Webhooks */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>
                  <Bell className="w-4 h-4 text-[#ffd600]" />
                  <span>Notification Webhooks & Escalations</span>
                </CardTitle>
                <CardDescription>
                  Real-time destinations triggered when cron jobs fail or recovery occurs.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                    Emergency Alert Email
                  </label>
                  <input
                    type="email"
                    value={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] transition-colors"
                    placeholder="oncall@company.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-openboy-text-main">
                      Slack Webhook URL
                    </label>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="text-[11px] text-[#ffd600] hover:text-[#eed000] flex items-center gap-1 cursor-pointer font-mono disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingWebhook ? "Sending..." : testSuccess ? "Sent!" : "Test Ping"}</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] font-mono transition-colors"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  {testSuccess && (
                    <span className="text-[11px] text-emerald-500 font-mono mt-1 block">
                      ✓ Simulated 200 OK test alert dispatched to webhook channel.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-openboy-text-main mb-1.5">
                    PagerDuty Integration Routing Key
                  </label>
                  <input
                    type="text"
                    value={pagerdutyKey}
                    onChange={(e) => setPagerdutyKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-openboy-surface-subtle text-openboy-text-main border border-openboy-border rounded-lg focus:outline-none focus:border-[#ffd600] font-mono transition-colors"
                    placeholder="pd_live_xxxx"
                  />
                  <span className="text-[11px] text-openboy-text-muted mt-1 block">
                    Events API v2 integration key for P1 downtime auto-escalations.
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* CARD 3: OpenBoy MCP Server for AI Editors */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>
                  <Sparkles className="w-4 h-4 text-[#ffd600]" />
                  <span>OpenBoy Model Context Protocol (MCP) Server</span>
                </CardTitle>
                <CardDescription>
                  Connect your IDE assistant (Cursor, Windsurf, Claude Code, Antigravity) to inspect cron executions directly.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={handleCopyMcp}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-openboy-border bg-openboy-surface-subtle hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-[#ffd600]" />
                <span>{copiedMcp ? "Copied JSON!" : "Copy Configuration"}</span>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-openboy-surface-subtle border border-openboy-border rounded-xl font-mono text-xs text-openboy-text-main overflow-x-auto">
              <pre className="whitespace-pre leading-relaxed">{mcpConfig}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings Action Button */}
        <div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center active:scale-[0.99]"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
