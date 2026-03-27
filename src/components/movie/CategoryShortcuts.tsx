"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const shortcuts = [
  { title: "Phim mới nhất", href: "/phim-moi", color: "bg-orange-500/10 text-orange-500" },
  { title: "Phim chiếu rạp", href: "/the-loai/chieu-rap", color: "bg-primary/10 text-primary" },
  { title: "Phim lồng tiếng", href: "/the-loai/long-tieng", color: "bg-emerald-500/10 text-emerald-500" },
  { title: "Phim thuyết minh", href: "/the-loai/thuyet-minh", color: "bg-amber-500/10 text-amber-500" },
  { title: "Phim cổ trang", href: "/the-loai/co-trang", color: "bg-rose-500/10 text-rose-500" },
  { title: "Phim kinh dị", href: "/the-loai/kinh-di", color: "bg-red-500/10 text-red-500" },
  { title: "Phim hình sự", href: "/the-loai/hinh-su", color: "bg-slate-500/10 text-slate-500" },
  { title: "Điện ảnh Âu Mỹ", href: "/quoc-gia/au-my", color: "bg-sky-500/10 text-sky-500" },
  { title: "Phim hoạt hình", href: "/hoat-hinh", color: "bg-violet-500/10 text-violet-500" },
];

export function CategoryShortcuts() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 lg:px-12 mt-4 mb-8">
      <div className="flex items-center justify-between mb-6 group">
        <h3 className="text-xl font-bold text-foreground">Bạn đang quan tâm?</h3>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-surface text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-surface text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
      >
        {shortcuts.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className={`group flex-shrink-0 flex items-center justify-center px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap ${item.color}`}
          >
            <span className="text-sm font-bold">{item.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
