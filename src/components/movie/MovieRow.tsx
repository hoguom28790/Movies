"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
  viewAllLink?: string; // support both
  isXX?: boolean;
}

export function MovieRow({ title, movies, viewAllHref, viewAllLink, isXX = false }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const finalViewAll = viewAllHref || viewAllLink;

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollTo = dir === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
  };

  if (movies.length === 0 && isXX) return null;

  return (
    <section className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-12 mb-6">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {finalViewAll && (
            <Link
              href={finalViewAll}
              className="text-sm font-bold text-primary hover:opacity-80 transition-all flex items-center gap-1"
            >
              Xem tất cả <ChevronRight size={14} />
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full bg-surface text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-sm"
              aria-label="Cuộn trái"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full bg-surface text-foreground-secondary hover:text-foreground transition-all flex items-center justify-center shadow-sm"
              aria-label="Cuộn phải"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative group">
        <div
          ref={rowRef}
          className="flex overflow-x-auto pb-4 scroll-smooth px-6 lg:px-12 no-scrollbar gap-4 md:gap-6"
        >
          {movies.map((movie, idx) => (
            <div 
              key={`${movie.id}-${idx}`} 
              className={cn(
                "flex-shrink-0",
                isXX ? "w-[160px] md:w-[220px]" : "w-[150px] sm:w-[180px] md:w-[200px]"
              )}
            >
              <MovieCard
                title={movie.title}
                slug={movie.slug}
                posterUrl={movie.posterUrl}
                year={movie.year}
                quality={movie.quality}
                originalTitle={movie.originalTitle}
                score={movie.imdbRating || movie.tmdbRating}
                isXX={isXX}
                index={idx % 10}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
