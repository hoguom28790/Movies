"use client";

import React from "react";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { Movie } from "@/types/movie";

interface XXBentoGridProps {
  title: string;
  movies: Movie[];
  viewAllLink?: string;
}

export function XXBentoGrid({ title, movies, viewAllLink }: XXBentoGridProps) {
  if (movies.length === 0) return null;

  // We'll use the first 5 movies for the bento pattern
  const bentoMovies = movies.slice(0, 5);

  return (
    <div className="space-y-8 mb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
          {title}
        </h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-sm font-bold text-white/40 hover:text-xx-primary transition-colors uppercase tracking-[0.2em] italic">
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
          />
        )}

        {/* Medium Cards */}
        {bentoMovies[1] && (
          <BentoItem 
            movie={bentoMovies[1]} 
            className="md:col-span-2 md:row-span-1" 
          />
        )}

        {/* Small Cards */}
        {bentoMovies[2] && (
          <BentoItem 
            movie={bentoMovies[2]} 
            className="md:col-span-1 md:row-span-1" 
          />
        )}
        
        {/* Small Cards */}
        {bentoMovies[3] && (
          <BentoItem 
            movie={bentoMovies[3]} 
            className="md:col-span-1 md:row-span-1" 
          />
        )}
      </div>
    </div>
  );
}

function BentoItem({ movie, className, large = false }: { movie: Movie, className: string, large?: boolean }) {
  return (
    <Link 
      href={`/collection/movie/${movie.slug}`}
      className={`relative group overflow-hidden rounded-3xl border border-white/10 bg-surface transition-all duration-500 hover:border-xx-primary/50 hover:shadow-[0_0_40px_rgba(255,215,0,0.1)] ${className}`}
    >
      <img 
        src={movie.posterUrl} 
        alt={movie.title} 
        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          {movie.quality && (
            <span className="px-2 py-0.5 bg-xx-primary text-black font-black text-[10px] rounded-md uppercase italic">
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              {movie.year}
            </span>
          )}
        </div>
        
        <h3 className={`${large ? "text-xl md:text-3xl" : "text-lg"} font-black text-white leading-tight uppercase italic group-hover:text-xx-primary transition-colors line-clamp-2`}>
          {movie.title}
        </h3>
        
        {large && movie.overview && (
          <p className="mt-2 text-sm text-white/40 line-clamp-2 hidden md:block">
             {movie.overview}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Play className="w-5 h-5 fill-current" />
        </div>
      </div>
    </Link>
  );
}
