"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "default" | "netflix" | "disney" | "apple";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeType;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.className = `theme-${savedTheme}`;
    }
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.className = newTheme === "default" ? "" : `theme-${newTheme}`;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
