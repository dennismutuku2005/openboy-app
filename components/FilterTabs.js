"use client";

/**
 * Shareable FilterTabs component for switching views or filter criteria across tables.
 * Includes automatic mobile select dropdown and responsive desktop pill bar.
 */
export default function FilterTabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  variant = "pills", // "pills" | "buttons" | "boxed"
}) {
  return (
    <div className={`w-full md:w-auto ${className}`}>
      {/* Mobile Select Dropdown */}
      <div className="md:hidden w-full">
        <select
          value={activeTab}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-openboy-surface border border-openboy-border text-openboy-text-main text-xs rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:border-[#ffd600] cursor-pointer"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Filter Pills */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#ffd600] text-black font-bold shadow-xs active:scale-95"
                  : "bg-openboy-surface text-openboy-text-muted hover:text-openboy-text-main border border-openboy-border hover:bg-openboy-surface-hover"
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-openboy-text-dim"}`} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-black/15 text-black font-bold"
                      : "bg-openboy-surface-subtle text-openboy-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
