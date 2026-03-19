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
      <div className="container relative z-10 mx-auto px-4 lg:px-8 flex flex-col items-start gap-5 pt-32 transition-all duration-700">
        <div 
          key={currentIndex} 
          className="flex flex-col items-start gap-5 animate-in slide-in-from-bottom-8 fade-in duration-700"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 items-center rounded bg-primary px-2.5 text-xs font-black text-white uppercase tracking-wider shadow-sm ring-1 ring-white/10">
              Nổi Bật
            </span>
            {currentMovie.quality && (
              <span className="flex h-7 items-center rounded-sm bg-white/10 backdrop-blur-md px-2.5 text-xs font-bold text-white ring-1 ring-white/20 uppercase">
                {currentMovie.quality}
              </span>
            )}
            {currentMovie.year && (
              <span className="text-sm font-bold text-white/70">{currentMovie.year}</span>
            )}
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white max-w-4xl leading-[1.1] tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            {currentMovie.title}
          </h1>

          {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
            <h2 className="text-xl lg:text-2xl text-white/60 font-medium drop-shadow-md max-w-2xl mt-[-8px]">
              {currentMovie.originalTitle}
            </h2>
          )}

          <div className="flex flex-wrap gap-4 mt-6">
            <Link href={`/movie/${currentMovie.slug}`}>
              <Button
                size="lg"
                className="h-13 px-8 text-lg font-black rounded-full gap-3 bg-gradient-to-r from-primary to-blue-500 text-white transition-all duration-300 shadow-[0_0_40px_rgba(0,99,229,0.6)] hover:shadow-[0_0_60px_rgba(0,99,229,0.9)] hover:-translate-y-1 hover:scale-105 border border-white/20 ring-4 ring-primary/20"
              >
                <Play className="w-6 h-6 fill-current" />
                XEM NGAY
              </Button>
            </Link>
            <Link href={`/movie/${currentMovie.slug}`}>
              <Button
                size="lg"
                variant="secondary"
                className="h-13 px-8 text-base font-bold rounded-lg gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/10 transition-all hover:scale-105"
              >
                <Info className="w-5 h-5" />
                Thông Tin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110"
        aria-label="Previous movie"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110"
        aria-label="Next movie"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2 pb-6">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full h-1.5 ${
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/70 hover:w-4"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
