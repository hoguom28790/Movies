"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
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
    const timer = setInterval(nextSlide, 8000); // Auto-slide every 8 seconds
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!movies.length) return null;

  const currentMovie = movies[currentIndex];

  return (
    <section className="relative w-full h-[85vh] min-h-[550px] flex items-center mt-[-64px] group overflow-hidden">
      {/* Background Images Layer */}
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
            className="object-cover transform scale-105"
          />
        </div>
      ))}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="container relative z-10 mx-auto px-4 lg:px-12 flex flex-col justify-end pb-24 h-full transition-all duration-700">
        <div 
          key={currentIndex} 
          className="flex flex-col items-start gap-5 animate-in slide-in-from-bottom-12 fade-in duration-1000 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
            <h2 className="text-lg lg:text-xl text-white/50 font-bold drop-shadow-md mt-[-15px]">
              {currentMovie.originalTitle}
            </h2>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a3ff] text-[12px] font-black text-white shadow-lg shadow-[#00a3ff]/20">
               <span>IMDb</span>
               <span>{currentMovie.imdbRating || "0.0"}</span>
            </div>
            {currentMovie.year && (
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[12px] font-bold text-white">
                {currentMovie.year}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[12px] font-bold text-white">
              {currentMovie.status || "HD"}
            </span>
            {currentMovie.quality && (
               <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[12px] font-bold text-white">
                 {currentMovie.quality}
               </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-[-5px]">
            {currentMovie.genres?.slice(0, 3).map((genre) => (
               <span key={genre} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-white/60">
                 {genre}
               </span>
            ))}
          </div>

          <p className="text-white/60 text-base font-medium max-w-2xl line-clamp-3 leading-relaxed drop-shadow-sm">
            {currentMovie.overview || "Đang cập nhật nội dung cho bộ phim này..."}
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <Link href={`/movie/${currentMovie.slug}`}>
              <Button
                size="lg"
                className="h-12 px-10 text-[15px] font-black rounded-full gap-2 bg-[#00a3ff] hover:bg-[#0095e6] text-white transition-all shadow-xl shadow-[#00a3ff]/30 hover:scale-105 active:scale-95 group/btn"
              >
                <Play className="w-5 h-5 fill-current" />
                Xem Ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation (Phimleak style) */}
      <div className="absolute right-8 bottom-16 z-30 hidden lg:flex items-center gap-4">
        {movies.map((movie, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-18 h-12 rounded-lg overflow-hidden border-2 transition-all duration-500 hover:scale-110 ${
              idx === currentIndex 
                ? "border-[#00a3ff] w-24 shadow-xl shadow-[#00a3ff]/20" 
                : "border-white/10 opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
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

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 backdrop-blur-3xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110 border border-white/5 active:scale-90"
        aria-label="Previous movie"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 backdrop-blur-3xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110 border border-white/5 active:scale-90"
        aria-label="Next movie"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Indicators - Mobile only */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex lg:hidden justify-center gap-2 pb-6">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full h-1 ${
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/20"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

