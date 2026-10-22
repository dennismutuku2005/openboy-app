"use client";

import { Search, X } from "lucide-react";

/**
 * Standardized SearchInput component used across schedules, executions, uptime, and incident tables.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  containerClassName = "",
  onClear,
}) {
  const handleChange = (e) => {
    if (typeof onChange === "function") {
      onChange(e.target.value);
    }
  };

  const handleClear = () => {
    if (typeof onClear === "function") {
      onClear();
    } else if (typeof onChange === "function") {
      onChange("");
    }
  };

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-openboy-text-muted pointer-events-none" />
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-8.5 pr-8 py-2 md:py-1.5 rounded-lg bg-openboy-surface border border-openboy-border text-xs text-openboy-text-main placeholder:text-openboy-text-dim focus:outline-none focus:border-[#ffd600] focus:ring-1 focus:ring-[#ffd600]/40 transition-all font-medium ${className}`}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-openboy-text-muted hover:text-openboy-text-main transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
