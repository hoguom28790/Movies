"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const shortcuts = [
  { title: "Hot Rần Rần", href: "/phim-moi", gradient: "from-orange-500/80 to-red-800/80" },
  { title: "Chiếu rạp", href: "/the-loai/chieu-rap", gradient: "from-primary/80 to-indigo-800/80" },
  { title: "Lồng tiếng", href: "/the-loai/long-tieng", gradient: "from-emerald-500/80 to-teal-800/80" },
  { title: "Thuyết Minh", href: "/the-loai/thuyet-minh", gradient: "from-amber-500/80 to-orange-800/80" },
  { title: "Cổ trang", href: "/the-loai/co-trang", gradient: "from-pink-500/80 to-rose-800/80" },
  { title: "Kinh dị", href: "/the-loai/kinh-di", gradient: "from-red-600/80 to-red-950/80" },
  { title: "Hình sự", href: "/the-loai/hinh-su", gradient: "from-slate-500/80 to-slate-800/80" },
  { title: "Điện ảnh Âu Mỹ", href: "/quoc-gia/au-my", gradient: "from-cyan-500/80 to-sky-800/80" },
  { title: "Hoạt hình", href: "/hoat-hinh", gradient: "from-violet-500/80 to-purple-800/80" },
];

export function CategoryShortcuts() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-4 lg:px-12 mt-8 mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white/80">Bạn đang quan tâm gì?</h3>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {shortcuts.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className={`group flex-shrink-0 relative overflow-hidden rounded-xl px-5 py-4 min-w-[140px] transition-all hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br ${item.gradient}`}
          >
            <span className="text-[13px] font-semibold text-white">{item.title}</span>
            <p className="text-[10px] text-white/50 mt-0.5 group-hover:text-white/80 transition-colors">
              Xem chủ đề
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
