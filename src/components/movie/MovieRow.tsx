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
    <section className={cn("relative", isXX ? "space-y-6 mb-16 animate-in fade-in duration-700" : "")}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 lg:px-12",
        isXX ? "px-2 mb-0" : "mb-5"
      )}>
        <h3 className={cn(
          "font-black uppercase italic tracking-tighter",
          isXX ? "text-xl md:text-2xl text-foreground" : "text-xl font-headline tracking-tight text-foreground"
        )}>
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {finalViewAll && (
            <Link
              href={finalViewAll}
              className={cn(
                "transition-colors uppercase italic",
                isXX ? "text-sm font-bold text-foreground/40 hover:text-yellow-500 tracking-[0.2em]" : "text-[12px] text-foreground/40 hover:text-foreground"
              )}
            >
              Xem toàn bộ
            </Link>
          )}
          {!isXX && (
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
          )}
        </div>
      </div>

      {/* Scrollable Row */}
      <div className={cn("relative group", isXX && "px-0")}>
        {isXX && (
          <>
            <button 
              onClick={() => scroll("left")}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-foreground/5 backdrop-blur-3xl border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-foreground/5 backdrop-blur-3xl border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div
          ref={rowRef}
          className={cn(
            "flex overflow-x-auto pb-4 scroll-smooth px-4 lg:px-12 scrollbar-hide no-scrollbar",
            isXX ? "gap-4 md:gap-6 pb-8 snap-x snap-mandatory" : "gap-3"
          )}
        >
          {movies.map((movie, idx) => (
            <div 
              key={`${movie.id}-${idx}`} 
              className={cn(
                "flex-shrink-0",
                isXX ? "min-w-[160px] md:min-w-[220px] snap-start" : "w-[145px] sm:w-[160px]"
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
      
      {isXX && (
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      )}
    </section>
  );
}
