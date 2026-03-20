"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/types/movie";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function MovieRow({ title, movies, viewAllHref }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <section className="relative px-4 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
          <span className="w-1.5 h-8 bg-primary rounded-full inline-block shadow-[0_0_15px_rgba(0,163,255,0.4)]" />
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-[13px] font-black text-white/40 hover:text-primary transition-all uppercase tracking-[0.2em]"
            >
              Xem tất cả
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2.5 rounded-full bg-white/5 hover:bg-primary border border-white/5 text-white/40 hover:text-white transition-all shadow-lg active:scale-95"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2.5 rounded-full bg-white/5 hover:bg-primary border border-white/5 text-white/40 hover:text-white transition-all shadow-lg active:scale-95"
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
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((movie, idx) => (
          <div key={`${movie.id}-${idx}`} className="flex-shrink-0 w-[160px] sm:w-[180px]">
            <MovieCard
              title={movie.title}
              slug={movie.slug}
              posterUrl={movie.thumbUrl || movie.posterUrl}
              year={movie.year}
              quality={movie.quality}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
