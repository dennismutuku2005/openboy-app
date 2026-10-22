"use client";

/**
 * Standardized HTTP Method badge (GET, POST, PUT, DELETE, etc.)
 */
export default function MethodBadge({ method = "GET", className = "" }) {
  const norm = String(method).toUpperCase();

  const colorMap = {
    GET: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25",
    POST: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25",
    PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    PATCH: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25",
    DELETE: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25",
  };

  const style = colorMap[norm] || "bg-openboy-surface-subtle text-openboy-text-muted border-openboy-border";

  return (
    <span
      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block select-none tracking-wide ${style} ${className}`}
    >
      {norm}
    </span>
  );
}
