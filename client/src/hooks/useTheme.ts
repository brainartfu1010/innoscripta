import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "news-aggregator-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme;
    return current === "dark" || current === "light" ? current : systemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setThemeState(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggleTheme() {
    setThemeState((current) => (current === "light" ? "dark" : "light"));
  }

  return { theme, toggleTheme };
}
