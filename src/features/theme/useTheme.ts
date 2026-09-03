import { useEffect, useState } from "react";
export type Theme = "light" | "dark";
export const THEME_KEY = "daily-money-theme-v1";
export const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";
const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const initialTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_KEY);
  return isTheme(saved) ? saved : systemTheme();
};
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)"),
      syncSystem = () => {
        if (!isTheme(localStorage.getItem(THEME_KEY))) setTheme(systemTheme());
      },
      syncTabs = (event: StorageEvent) => {
        if (event.key === THEME_KEY)
          setTheme(isTheme(event.newValue) ? event.newValue : systemTheme());
      };
    media.addEventListener("change", syncSystem);
    window.addEventListener("storage", syncTabs);
    return () => {
      media.removeEventListener("change", syncSystem);
      window.removeEventListener("storage", syncTabs);
    };
  }, []);
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  };
  return { theme, toggleTheme };
};
