"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Star, Film } from "lucide-react";
import { Button } from "@/components/ui/Button";

import type { Movie } from "@/types/movie";

interface HeroSliderProps {
  movies: Movie[];
}

export function HeroSlider({ movies }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!movies.length) return null;

  const currentMovie = movies[currentIndex];

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[75vh] min-h-[400px] flex items-end mt-[-56px] group overflow-hidden">
      {/* Background Images */}
      {movies.map((movie, idx) => (
        <div 
          key={movie.slug}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={movie.thumbUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority={idx === 0}
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 lg:px-12 pb-12 sm:pb-16 transition-all duration-700">
        <div 
          key={currentIndex} 
          className="flex flex-col items-start gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 max-w-3xl"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            {currentMovie.title}
          </h1>

          {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
            <p className="text-sm text-white/40 -mt-2">
              {currentMovie.originalTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* TMDB Rating */}
            {(currentMovie.tmdbRating !== undefined && currentMovie.tmdbRating !== null) && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">TMDB</span>
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-blue-400 fill-current" />
                  <span className="text-[12px] font-bold text-white">
                    {currentMovie.tmdbRating > 0 ? currentMovie.tmdbRating.toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
            )}

            {/* IMDB Rating */}
            {(currentMovie.imdbRating !== undefined && currentMovie.imdbRating !== null) && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">IMDB</span>
                <div className="flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                  <span className="text-[12px] font-bold text-white">
                    {currentMovie.imdbRating > 0 ? currentMovie.imdbRating.toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
            )}

            {currentMovie.genres?.slice(0, 3).map((genre) => (
              <Link key={genre} href={`/the-loai/${genre}`} className="px-3 py-1 rounded-md bg-white/5 text-[12px] text-white/50 hover:text-white transition-colors">
                {genre}
              </Link>
            ))}
          </div>

          <p className="text-white/40 text-sm max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {currentMovie.overview ? currentMovie.overview.replace(/<[^>]*>/g, '') : "Đang cập nhật nội dung cho bộ phim này..."}
          </p>

          <Link href={`/movie/${currentMovie.slug}`}>
            <Button
              size="lg"
              className="h-11 px-8 text-[13px] font-semibold rounded-lg gap-2 bg-primary hover:bg-primary-hover text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <Play className="w-4 h-4 fill-current" />
              Xem Ngay
            </Button>
          </Link>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="absolute right-8 bottom-12 z-30 hidden lg:flex items-center gap-3">
        {movies.map((movie, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
              idx === currentIndex 
                ? "border-primary w-20 shadow-lg shadow-primary/20" 
                : "border-white/10 opacity-40 hover:opacity-80 grayscale hover:grayscale-0"
            }`}
          >
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Navigation arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Mobile dots */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex lg:hidden justify-center gap-1.5 pb-4">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full h-1 ${
              idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/20"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
