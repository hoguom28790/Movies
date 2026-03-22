"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type StylePreset = "default" | "netflix" | "disney" | "apple";

interface StylePresetContextType {
  preset: StylePreset;
  setPreset: (preset: StylePreset) => void;
}

const StylePresetContext = createContext<StylePresetContextType | undefined>(undefined);

export function StylePresetProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<StylePreset>("default");

  useEffect(() => {
    const saved = localStorage.getItem("style-preset") as StylePreset;
    if (saved) {
      setPresetState(saved);
      document.documentElement.setAttribute("data-preset", saved);
    }
  }, []);

  const setPreset = (v: StylePreset) => {
    setPresetState(v);
    localStorage.setItem("style-preset", v);
    document.documentElement.setAttribute("data-preset", v);
  };

  return (
    <StylePresetContext.Provider value={{ preset, setPreset }}>
      {children}
    </StylePresetContext.Provider>
  );
}

export function useStylePreset() {
  const context = useContext(StylePresetContext);
  if (context === undefined) {
    throw new Error("useStylePreset must be used within a StylePresetProvider");
  }
  return context;
}
