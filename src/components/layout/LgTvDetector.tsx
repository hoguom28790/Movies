"use client";

import { useEffect } from "react";

export function LgTvDetector() {
  useEffect(() => {
    // LG webOS TV detection via User-Agent + apply .is-lg-tv class for TV-specific overrides
    const ua = navigator.userAgent;
    const isLgTv = /Web0S|webOS|SmartTV|LG Browser|LG.TV/.test(ua);
    
    // Fallback/Reinforcement: Large screen, no touch, potentially a TV
    const isLargeDisplayNonTouch = 
      window.screen.width >= 1920 && 
      !('ontouchstart' in window) && 
      !ua.includes("Windows") && 
      !ua.includes("Macintosh");

    const shouldEnableTvMode = isLgTv || isLargeDisplayNonTouch;

    if (shouldEnableTvMode) {
      document.documentElement.classList.add("is-lg-tv");
    }

    return () => {
      document.documentElement.classList.remove("is-lg-tv");
    };
  }, []);

  return null;
}
