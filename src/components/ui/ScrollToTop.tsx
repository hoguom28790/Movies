"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollTop}
      aria-label="Cuộn lên đầu trang"
      className="fixed bottom-8 right-6 z-50 p-3 rounded-full bg-primary/90 hover:bg-primary border border-white/10 text-white shadow-[0_4px_20px_rgba(229,9,20,0.4)] backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_30px_rgba(229,9,20,0.6)]"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
