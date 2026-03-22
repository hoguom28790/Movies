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
    <section className="relative w-full h-[751px] flex items-end overflow-hidden mt-[-64px]">
      {/* Background Images with Zoom Animation */}
      {movies.map((movie, idx) => (
        <div 
          key={movie.slug}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-110"
          }`}
        >
          <Image
            src={movie.thumbUrl || movie.posterUrl}
            alt={movie.title}
            fill
            sizes="100vw"
            quality={90}
            priority={idx === 0}
            className="object-cover transition-transform duration-[8000ms] ease-linear group-hover:scale-110"
            unoptimized={!movie.thumbUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
          />
        </div>
      ))}

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 z-0 bg-[var(--banner-overlay)]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-background/90 via-transparent to-transparent" />

      {/* Content Container */}
      <div className="container relative z-10 mx-auto px-6 lg:px-12 pb-20 w-full transition-all duration-700">
        <div 
          key={currentIndex} 
          className="flex flex-col items-start gap-4 animate-in slide-in-from-bottom-12 fade-in duration-1000 max-w-[85%]"
        >
          <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20">
            Phim Đề Cử
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-headline leading-[0.9] tracking-tighter text-foreground uppercase drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          <p className="text-foreground/60 text-lg sm:text-xl font-medium tracking-wide drop-shadow-md">
            {currentMovie.originalTitle || "Sẵn sàng để xem"} • {currentMovie.year} • {currentMovie.quality}
          </p>

          <div className="flex items-center gap-3 mt-4">
            <Link href={`/phim/${currentMovie.slug}`} className="flex-1 md:flex-none">
              <Button
                size="lg"
                className="h-14 px-10 text-[16px] font-black rounded-xl gap-2 bg-gradient-to-br from-primary to-primary-container text-white border-none shadow-[0_8px_25px_rgba(59,130,246,0.3)] transition-all hover:scale-105 active:scale-95 group"
              >
                <Play className="w-6 h-6 fill-current group-hover:animate-pulse" />
                XEM NGAY
              </Button>
            </Link>
            
            <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/5 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all">
              <span className="text-[32px] font-light leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Thumbnails (Desktop Only) */}
      <div className="absolute right-12 bottom-12 z-30 hidden lg:flex items-center gap-4">
        {movies.map((movie, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-20 h-28 rounded-xl overflow-hidden border-2 transition-all duration-500 hover:scale-110 ${
              idx === currentIndex 
                ? "border-primary shadow-2xl shadow-primary/40 scale-105" 
                : "border-white/10 opacity-30 hover:opacity-100 grayscale hover:grayscale-0"
            }`}
          >
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="150px"
              quality={50}
              className="object-cover"
              unoptimized={!movie.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
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
