"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

interface BentoGridProps {
  title: string;
  movies: Movie[];
  viewAllLink?: string;
  isXX?: boolean;
}

export function BentoGrid({ title, movies, viewAllLink, isXX = false }: BentoGridProps) {
  if (movies.length === 0) return null;

  // We'll use the first 5 movies for the bento pattern
  const bentoMovies = movies.slice(0, 5);

  const primaryColor = isXX ? "text-yellow-500" : "text-primary";
  const primaryBg = isXX ? "bg-yellow-500" : "bg-primary";
  const primaryBorder = isXX ? "hover:border-yellow-500/50" : "hover:border-primary/50";
  const primaryShadow = isXX ? "hover:shadow-[0_0_40px_rgba(234,179,8,0.1)]" : "hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]";

  return (
    <section className="space-y-8 mb-20 px-6 lg:px-20 overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <h2 className={cn(
          "font-black text-white uppercase italic tracking-tighter",
          isXX ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
        )}>
          {title}
        </h2>
        {viewAllLink && (
          <Link 
            href={viewAllLink} 
            className={cn(
              "text-sm font-bold transition-all uppercase tracking-[0.2em] italic",
              isXX ? "text-white/40 hover:text-yellow-500" : "text-white/40 hover:text-primary"
            )}
          >
            Discovery
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[1000px] md:h-[600px]">
        {/* Large Feature Card */}
        {bentoMovies[0] && (
          <BentoItem 
            movie={bentoMovies[0]} 
            className="md:col-span-2 md:row-span-2" 
            large 
            isXX={isXX}
          />
        )}

        {/* Medium Card */}
        {bentoMovies[1] && (
          <BentoItem 
            movie={bentoMovies[1]} 
            className="md:col-span-2 md:row-span-1" 
            isXX={isXX}
          />
        )}

        {/* Small Card */}
        {bentoMovies[2] && (
          <BentoItem 
            movie={bentoMovies[2]} 
            className="md:col-span-1 md:row-span-1" 
            isXX={isXX}
          />
        )}
        
        {/* Small Card */}
        {bentoMovies[3] && (
          <BentoItem 
            movie={bentoMovies[3]} 
            className="md:col-span-1 md:row-span-1" 
            isXX={isXX}
          />
        )}
      </div>
    </section>
  );
}

function BentoItem({ movie, className, large = false, isXX = false }: { movie: Movie, className: string, large?: boolean, isXX?: boolean }) {
  const primaryColor = isXX ? "group-hover:text-yellow-500" : "group-hover:text-primary";
  const primaryBg = isXX ? "bg-yellow-500" : "bg-primary";
  const primaryBorder = isXX ? "hover:border-yellow-500/50" : "hover:border-primary/50";
  const primaryShadow = isXX ? "hover:shadow-[0_0_40px_rgba(234,179,8,0.1)]" : "hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]";

  const linkHref = isXX ? `/${TOPXX_PATH}/phim/${movie.slug}` : (movie.slug.startsWith('/') ? movie.slug : `/phim/${movie.slug}`);

  return (
    <Link 
      href={linkHref}
      className={cn(
        "relative group overflow-hidden rounded-[32px] border border-white/5 bg-surface transition-all duration-700 active-depth",
        primaryBorder,
        primaryShadow,
        className
      )}
    >
      <img 
        src={movie.posterUrl} 
        alt={movie.title} 
        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          {movie.quality && (
            <span className={cn(
              "px-2.5 py-1 text-black font-black text-[10px] rounded-xl uppercase italic shadow-xl",
              isXX ? "bg-yellow-500 shadow-yellow-500/20" : "bg-primary shadow-primary/20"
            )}>
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest italic ml-1">
              • {movie.year}
            </span>
          )}
        </div>
        
        <h3 className={cn(
          "font-black text-white leading-tight uppercase italic transition-colors line-clamp-2",
          primaryColor,
          large ? "text-2xl md:text-3xl" : "text-lg"
        )}>
          {movie.title}
        </h3>
        
        {large && movie.overview && (
          <p className="mt-3 text-[13px] text-white/40 line-clamp-2 hidden md:block font-medium italic">
             {movie.overview}
          </p>
        )}
        
        <div className={cn(
          "mt-6 flex items-center justify-center w-12 h-12 rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-2xl backdrop-blur-3xl",
          isXX ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-primary/10 border-primary/20 text-primary"
        )}>
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
