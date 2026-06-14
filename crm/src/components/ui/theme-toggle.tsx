"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/60 border border-border/50"
        aria-label="Toggle theme"
      >
        <div className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-border transition-all duration-200 cursor-pointer group"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark
            ? "opacity-0 rotate-90 scale-0"
            : "opacity-100 rotate-0 scale-100 text-amber-500"
        }`}
      />
      <Moon
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark
            ? "opacity-100 rotate-0 scale-100 text-blue-400"
            : "opacity-0 -rotate-90 scale-0"
        }`}
      />
    </button>
  );
}
