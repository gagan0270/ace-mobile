import { useEffect, useState, useCallback } from "react";

const KEY = "ace.theme";
const MODE_KEY = "ace.theme_mode";

function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

export function useTheme() {
  const [mode, setModeState] = useState(() => {
    try {
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === "dark" || savedMode === "light" || savedMode === "system") {
        return savedMode;
      }
      const legacyTheme = localStorage.getItem(KEY);
      if (legacyTheme === "dark" || legacyTheme === "light") {
        return legacyTheme;
      }
    } catch {
      /* noop */
    }
    return "dark";
  });

  const [theme, setThemeState] = useState(() => {
    if (mode === "system") return getSystemTheme();
    return mode;
  });

  const applyTheme = useCallback((resolvedTheme) => {
    setThemeState(resolvedTheme);
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem(KEY, resolvedTheme);
    } catch {}
  }, []);

  useEffect(() => {
    if (mode === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      applyTheme(media.matches ? "dark" : "light");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    } else {
      applyTheme(mode);
    }
  }, [mode, applyTheme]);

  const setMode = (newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(MODE_KEY, newMode);
    } catch {}
  };

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setMode(next);
  };

  return {
    theme,
    mode,
    setMode,
    toggle,
    isDark: theme === "dark",
  };
}

export default useTheme;
