"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { XXMovieCard } from "@/components/movie/XXMovieCard";
import type { Movie } from "@/types/movie";

interface XXMovieRowProps {
  title: string;
  movies: Movie[];
  viewAllLink?: string;
}

export function XXMovieRow({ title, movies, viewAllLink }: XXMovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-6 mb-16 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase italic tracking-tighter">
          {title}
        </h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm font-bold text-foreground/40 hover:text-primary transition-colors uppercase tracking-[0.2em] italic">
            Xem Tất Cả
          </Link>
        )}
      </div>

      <div className="relative group">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll("left")}
          className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-foreground/5 backdrop-blur-3xl border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-primary-foreground hover:bg-primary opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => scroll("right")}
          className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-foreground/5 backdrop-blur-3xl border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-primary-foreground hover:bg-primary opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-8 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {movies.map((movie) => (
            <div key={movie.id} className="min-w-[160px] md:min-w-[220px] snap-start">
              <XXMovieCard 
                title={movie.title} 
                slug={movie.slug} 
                posterUrl={movie.posterUrl} 
                year={movie.year} 
                quality={movie.quality} 
              />
            </div>
          ))}
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
