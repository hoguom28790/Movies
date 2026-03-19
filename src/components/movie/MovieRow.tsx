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
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full inline-block" />
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-semibold text-white/50 hover:text-primary transition-colors"
            >
              Xem tất cả →
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="w-4 h-4" />
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
