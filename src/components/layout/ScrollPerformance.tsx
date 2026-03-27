"use client";

import { useEffect } from "react";

export function ScrollPerformance() {
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    const body = document.body;

    const onScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      
      if (!body.classList.contains('scrolling')) {
        body.classList.add('scrolling');
      }

      scrollTimer = setTimeout(() => {
        body.classList.remove('scrolling');
        scrollTimer = null;
      }, 150); // Remove after 150ms of stillness
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  return null;
}
