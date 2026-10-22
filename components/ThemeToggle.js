"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * ThemeToggle Component
 * @param {Object} props
 * @param {"compact"|"segmented"|"pill"|"button"} [props.variant="compact"] - Display style
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.showLabel=false] - Whether to show text next to icon
 */
export default function ThemeToggle({
  variant = "compact",
  className = "",
  showLabel = false,
}) {
  const { theme, toggleTheme, setTheme, isDark, mounted } = useTheme();

  // Segmented switch (e.g. for Settings & Preferences page)
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-openboy-surface-subtle border border-openboy-border shadow-xs ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isDark
              ? "bg-[#28311a] text-[#ffd600] shadow-xs border border-[#3e4a29]"
              : "text-openboy-text-muted hover:text-openboy-text-main"
          }`}
          aria-pressed={isDark}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark Olive</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isDark
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
              : "text-openboy-text-muted hover:text-openboy-text-main"
          }`}
          aria-pressed={!isDark}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light Clean</span>
        </button>
      </div>
    );
  }

  // Pill variant with label
  if (variant === "pill" || showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-openboy-border bg-openboy-surface hover:bg-openboy-surface-hover text-openboy-text-main text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98] ${className}`}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-[#ffd600] transition-transform duration-300 hover:rotate-45" />
            <span>Light Theme</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-300 hover:-rotate-12" />
            <span>Dark Theme</span>
          </>
        )}
      </button>
    );
  }

  // Compact icon button for Navbar / Sidebar
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg border border-openboy-border bg-openboy-surface hover:bg-openboy-surface-hover text-openboy-text-main transition-all cursor-pointer shadow-xs active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#ffd600]/40 ${className}`}
      title={isDark ? "Switch to light theme (Clean Alabaster)" : "Switch to dark theme (Dark Olive)"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="relative w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun className="w-4 h-4 text-[#ffd600] group-hover:scale-110 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-800 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
          )
        ) : (
          <div className="w-4 h-4" />
        )}
      </div>
    </button>
  );
}
