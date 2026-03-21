"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Flame } from "lucide-react";
import { ComicCard } from "./ComicCard";

interface ComicRowProps {
  title: string;
  comics: any[];
  domainCdn: string;
  viewAllHref?: string;
  icon?: "flame" | "book";
}

export function ComicRow({ title, comics, domainCdn, viewAllHref, icon }: ComicRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <section className="relative space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-3 relative">
          {icon === "flame" ? (
             <>
               <div className="absolute -left-4 md:-left-8 -top-8 w-24 h-24 bg-primary/20 blur-[50px] rounded-full" />
               <Flame className="w-8 h-8 md:w-10 md:h-10 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" />
             </>
          ) : (
             <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" />
          )}
          <h2 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase relative z-10">
            {title}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-[12px] sm:text-[14px] text-white/40 hover:text-white transition-colors"
            >
              Xem tất cả
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-2 scrollbar-hide scroll-smooth px-4 md:px-0"
      >
        {comics.map((comic, idx) => (
          <div key={`${comic._id}-${idx}`} className="flex-shrink-0 w-[150px] sm:w-[170px] lg:w-[190px]">
            <ComicCard
              title={comic.name}
              slug={comic.slug}
              posterUrl={`${domainCdn}/uploads/comics/${comic.thumb_url}`}
              latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
              originalTitle={comic.origin_name?.[0] || ""}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
