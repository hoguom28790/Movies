"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
       <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5">
          <Moon className="w-5 h-5 text-white/50 animate-pulse" />
       </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (theme === "light") return <Sun className="w-5 h-5" />;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === "light") return "Sáng";
    if (theme === "dark") return "Tối";
    return "Hệ thống";
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl glass hover:bg-primary/20 hover:border-primary/50 transition-all group overflow-hidden"
      title={`Theme: ${getLabel()}`}
    >
      <div className="text-foreground transition-all duration-300 transform group-hover:scale-110">
        {getIcon()}
      </div>
      
      {/* Tooltip-like label appearing on hover or for focus */}
      <span className="sr-only">Đổi giao diện: {getLabel()}</span>
    </button>
  );
}
