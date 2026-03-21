"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import type { Movie } from "@/types/movie";

interface BentoMovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function BentoMovieRow({ title, movies, viewAllHref }: BentoMovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (movies.length === 0) return null;

  const featured = movies[0];
  const others = movies.slice(1, 10);

  return (
    <section className="mt-12 group/row">
      <div className="px-6 lg:px-12 flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black font-headline tracking-tight text-white uppercase">
            {title}
          </h3>
          <div className="h-1 w-12 bg-primary mt-1 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        </div>
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="text-primary text-[12px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform"
          >
            Tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div 
        ref={rowRef}
        className="flex overflow-x-auto hide-scrollbar gap-4 px-6 lg:px-12 snap-x"
      >
        {/* Featured Large Card */}
        <div className="flex-shrink-0 w-72 snap-start">
          <Link 
            href={`/phim/${featured.slug}`}
            className="relative group rounded-2xl overflow-hidden aspect-[3/4] bg-surface shadow-2xl block"
          >
            <Image 
              src={featured.posterUrl} 
              alt={featured.title} 
              fill
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              unoptimized={!featured.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-white/10 uppercase tracking-tighter">HD</span>
              <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-primary/20">
                <Star className="w-2.5 h-2.5 fill-current" /> 
                {featured.tmdbRating ? featured.tmdbRating.toFixed(1) : "HOT"}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent opacity-90"></div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-white font-black text-xl leading-none tracking-tight uppercase line-clamp-2">{featured.title}</p>
              <p className="text-white/40 text-[11px] font-bold mt-2 uppercase tracking-widest">Hành Động • {featured.year}</p>
            </div>
          </Link>
        </div>

        {/* Standard Cards */}
        {others.map((movie) => (
          <div key={movie.slug} className="flex-shrink-0 w-44 snap-start">
            <Link 
              href={`/phim/${movie.slug}`}
              className="relative group rounded-2xl overflow-hidden aspect-[2/3] bg-surface block border border-white/5 shadow-xl hover:border-primary/30 transition-all"
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.title} 
                fill
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                unoptimized={!movie.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-black text-sm tracking-tight leading-tight line-clamp-2 uppercase">{movie.title}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
