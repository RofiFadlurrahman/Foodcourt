"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredTheme, setStoredTheme } from "@/lib/session";

function applyTheme(theme: "dark" | "light") {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  setStoredTheme(theme);
}

export default function ThemeToggle({ className = "", iconClassName = "" }: { className?: string; iconClassName?: string }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = getStoredTheme();
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemPrefersDark ? "dark" : "light";

    applyTheme(initialTheme);
    setTimeout(() => {
      setIsDarkMode(initialTheme === "dark");
    }, 0);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    applyTheme(nextTheme);
  };

  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label={isDarkMode === null ? "Toggle theme" : `Switch to ${isDarkMode ? "light" : "dark"} mode`}>
      {isDarkMode === null ? null : isDarkMode ? <Sun className={`w-4 h-4 text-secondary ${iconClassName}`} /> : <Moon className={`w-4 h-4 text-primary ${iconClassName}`} />}
    </button>
  );
}
