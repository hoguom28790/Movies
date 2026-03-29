"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface CategoryShortcutsProps {
  posters?: Record<string, string | undefined>;
}

const shortcuts = [
  { id: "phim-moi", title: "Phim mới nhất", href: "/phim-moi", color: "from-orange-600/80 to-orange-900/90" },
  { id: "chieu-rap", title: "Phim chiếu rạp", href: "/the-loai/chieu-rap", color: "from-primary/80 to-blue-900/90" },
  { id: "long-tieng", title: "Phim lồng tiếng", href: "/the-loai/long-tieng", color: "from-emerald-600/80 to-emerald-900/90" },
  { id: "thuyet-minh", title: "Phim thuyết minh", href: "/the-loai/thuyet-minh", color: "from-amber-600/80 to-amber-900/90" },
  { id: "co-trang", title: "Phim cổ trang", href: "/the-loai/co-trang", color: "from-rose-600/80 to-rose-900/90" },
  { id: "kinh-di", title: "Phim kinh dị", href: "/the-loai/kinh-di", color: "from-red-600/80 to-red-900/90" },
  { id: "hinh-su", title: "Phim hình sự", href: "/the-loai/hinh-su", color: "from-slate-600/80 to-slate-900/90" },
  { id: "au-my", title: "Điện ảnh Âu Mỹ", href: "/quoc-gia/au-my", color: "from-sky-600/80 to-sky-900/90" },
  { id: "hoat-hinh", title: "Phim hoạt hình", href: "/hoat-hinh", color: "from-violet-600/80 to-violet-900/90" },
];

export function CategoryShortcuts({ posters = {} }: CategoryShortcutsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 lg:px-12 mt-4 mb-16">
      <div className="flex items-center justify-between mb-8 group">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">Bạn đang quan tâm?</h3>
          <p className="text-foreground/40 text-xs font-bold uppercase tracking-[0.2em]">Khám phá các bộ sưu tập đặc sắc</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full bg-surface border border-white/5 text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-xl hover:bg-white/5 active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full bg-surface border border-white/5 text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-xl hover:bg-white/5 active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-8 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {shortcuts.map((item, idx) => {
          const poster = posters[item.id];
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -8, scale: 1.02 }}
              className="flex-shrink-0"
            >
              <Link
                href={item.href}
                className="relative group flex flex-col items-center justify-center w-56 h-32 rounded-[28px] overflow-hidden shadow-2xl transition-all block"
              >
                {/* Background Image */}
                {poster ? (
                  <div className="absolute inset-0">
                    <Image 
                      src={poster} 
                      alt={item.title}
                      fill
                      className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} mix-blend-multiply opacity-80`} />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
                )}
                
                {/* Content */}
                <div className="relative z-10 text-center px-4">
                  <span className="text-sm font-black text-white uppercase italic tracking-wider drop-shadow-md group-hover:scale-110 transition-transform block">
                    {item.title}
                  </span>
                  <div className="mt-2 w-8 h-1 bg-white/40 group-hover:w-16 transition-all duration-300 mx-auto rounded-full" />
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
