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
      <div className="flex items-center justify-between mb-5 px-4 lg:px-12">
        <h3 className="text-base font-semibold text-white/90">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-[12px] text-white/40 hover:text-white transition-colors"
            >
              Xem toàn bộ
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
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
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-4 lg:px-12"
      >
        {movies.map((movie, idx) => (
          <div key={`${movie.id}-${idx}`} className="flex-shrink-0 w-[145px] sm:w-[160px]">
            <MovieCard
              title={movie.title}
              slug={movie.slug}
              posterUrl={movie.thumbUrl || movie.posterUrl}
              year={movie.year}
              quality={movie.quality}
              originalTitle={movie.originalTitle}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
