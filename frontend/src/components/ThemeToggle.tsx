"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "", iconClassName = "" }: { className?: string; iconClassName?: string }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem("foodcourt_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemPrefersDark ? "dark" : "light";

    setIsDarkMode(initialTheme === "dark");
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: "dark" | "light") => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("foodcourt_theme", theme);
  };

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    applyTheme(nextTheme);
  };

  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label={isDarkMode === null ? "Toggle theme" : `Switch to ${isDarkMode ? "light" : "dark"} mode`}>
      {isDarkMode === null ? null : isDarkMode ? <Sun className={`w-4 h-4 text-amber-400 ${iconClassName}`} /> : <Moon className={`w-4 h-4 text-indigo-600 ${iconClassName}`} />}
    </button>
  );
}
