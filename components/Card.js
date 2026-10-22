"use client";

/**
 * Standardized Card layout components with responsive padding and light/dark theme borders.
 */
export function Card({ children, className = "", onClick, as = "div" }) {
  const Component = onClick ? "button" : as;
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-openboy-surface border border-openboy-border rounded-xl shadow-xs transition-colors text-left ${
        onClick ? "hover:border-[#ffd600]/60 hover:shadow-md cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-5 border-b border-openboy-border ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-sm sm:text-base font-bold text-openboy-text-main flex items-center gap-2 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-xs text-openboy-text-muted mt-0.5 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-5 border-t border-openboy-border bg-openboy-surface-subtle rounded-b-xl flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
