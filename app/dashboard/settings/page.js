"use client";

import { useState } from "react";
import { Bell, Key, Sparkles, Check, Sliders } from "lucide-react";

export default function SettingsPage() {
  const [defaultInterval, setDefaultInterval] = useState("30s");
  const [emailAlerts, setEmailAlerts] = useState("admin@openboy.dev");
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T00/B00/XXXX");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Integrations</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure default cron intervals, alert channels, and your AI editor MCP server.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Defaults Section */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#ffd600]" />
          <span>Monitor Defaults</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Default Ping Interval
            </label>
            <select
              value={defaultInterval}
              onChange={(e) => setDefaultInterval(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#242918] text-white border border-[#353d26] rounded focus:outline-none focus:border-[#ffd600]"
            >
              <option value="10s">10 Seconds (High frequency)</option>
              <option value="30s">30 Seconds (Standard default)</option>
              <option value="10m">10 Minutes (Batcher default)</option>
            </select>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Standard interval preselected when opening Create Monitor.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Default Timeout Threshold
            </label>
            <input
              type="text"
              defaultValue="10 seconds"
              className="w-full px-3 py-2 text-xs bg-[#242918] text-white border border-[#353d26] rounded focus:outline-none focus:border-[#ffd600]"
            />
          </div>
        </div>
      </div>

      {/* Alert Destinations */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#ffd600]" />
          <span>Alert Channels</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Email Notifications
            </label>
            <input
              type="email"
              value={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#242918] text-white border border-[#353d26] rounded focus:outline-none focus:border-[#ffd600]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Slack Webhook URL
            </label>
            <input
              type="text"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#242918] text-white border border-[#353d26] rounded focus:outline-none focus:border-[#ffd600] font-mono"
            />
          </div>
        </div>
      </div>

      {/* OpenBoy MCP AI Configuration */}
      <div className="bg-[#1b2013] border border-[#2b341f] rounded-xl p-6 space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ffd600]" />
          <span>OpenBoy MCP Server (AI Editors)</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Connect OpenBoy to Cursor, Windsurf, or Claude Code to let your AI assistant generate, ping, and inspect cron jobs automatically.
        </p>

        <div className="p-3 bg-[#14170e] border border-[#29321c] rounded-md font-mono text-xs text-zinc-300 overflow-x-auto">
          <code>
{`{
  "mcpServers": {
    "openboy": {
      "command": "npx",
      "args": ["-y", "@openboy/mcp-server"],
      "env": {
        "OPENBOY_API_KEY": "ob_live_948f21908bcda"
      }
    }
  }
}`}
          </code>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#ffd600] hover:bg-[#eed000] text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow flex items-center justify-center"
      >
        Save Settings
      </button>
    </div>
  );
}
