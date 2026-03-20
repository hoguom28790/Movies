"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Movie {
  slug: string;
  title: string;
  originalTitle?: string;
  posterUrl: string;
  quality?: string;
  year?: string;
}

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
            src={movie.posterUrl}
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
      <div className="container relative z-10 mx-auto px-4 lg:px-8 flex flex-col items-start gap-8 pt-32 transition-all duration-700">
        <div 
          key={currentIndex} 
          className="flex flex-col items-start gap-6 animate-in slide-in-from-bottom-8 fade-in duration-700"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 items-center rounded-lg bg-primary px-3 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-primary/20">
              Phim Hot
            </span>
            {currentMovie.quality && (
              <span className="flex h-7 items-center rounded-lg bg-white/10 backdrop-blur-xl px-3 text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">
                {currentMovie.quality}
              </span>
            )}
            {currentMovie.year && (
              <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black text-white/50 tracking-widest uppercase animate-pulse">
                {currentMovie.year}
              </span>
            )}
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white max-w-4xl leading-[1.1] tracking-tighter drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
            <h2 className="text-xl lg:text-2xl text-primary font-bold drop-shadow-md max-w-2xl mt-[-15px] italic opacity-80">
              {currentMovie.originalTitle}
            </h2>
          )}

          <p className="text-white/40 text-sm font-medium max-w-xl line-clamp-2 italic">
            Trải nghiệm điện ảnh đỉnh cao với chất lượng {currentMovie.quality || "HD"} tại Hồ Phim.
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <Link href={`/movie/${currentMovie.slug}`}>
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-black rounded-full gap-3 bg-primary hover:bg-primary-hover text-white transition-all shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 group/btn"
              >
                <Play className="w-6 h-6 fill-current group-hover/btn:scale-125 transition-transform" />
                XEM NGAY
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation (Phimleak style) */}
      <div className="absolute right-8 bottom-12 z-30 hidden lg:flex items-center gap-3">
        {movies.map((movie, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
              idx === currentIndex ? "border-primary w-24 scale-110 shadow-lg shadow-primary/40" : "border-white/10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
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

