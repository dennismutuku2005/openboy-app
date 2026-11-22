"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="openboy_theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const nextTheme = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (nextTheme.theme || nextTheme.resolvedTheme || "light") : "light";
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    nextTheme.setTheme(next);
  };

  return {
    ...nextTheme,
    theme: currentTheme,
    isDark,
    toggleTheme,
    mounted,
  };
}

export default ThemeProvider;
