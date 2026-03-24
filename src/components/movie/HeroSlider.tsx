"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Plus, Sparkles, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PlaylistModal } from "@/components/movie/PlaylistModal";
import type { Movie } from "@/types/movie";

interface HeroSliderProps {
  movies: Movie[];
}

export function HeroSlider({ movies }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!movies.length) return null;

  const currentMovie = movies[currentIndex];

  return (
    <section className="relative w-full h-[90vh] min-h-[800px] flex items-end overflow-hidden mt-[-80px] group select-none">
      {/* Background Layer with Parallax & Neural Blur */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div 
          key={currentIndex}
          custom={direction}
          initial={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
          animate={{ opacity: 1, scale: 1.05, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <Image
            src={currentMovie.thumbUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            fill
            sizes="100vw"
            quality={100}
            priority
            className="object-cover scale-110"
            unoptimized={!currentMovie.thumbUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
          />
          {/* Neural Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-transparent hidden lg:block pointer-events-none" />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Interface */}
      <div className="container relative z-20 mx-auto px-6 lg:px-16 pb-32 w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, x: -50, filter: "blur(20px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 30, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-8 max-w-5xl"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 px-6 py-2 glass-pro rounded-full border border-white/10 shadow-cinematic-lg"
            >
               <Sparkles className="w-4 h-4 text-primary animate-pulse" />
               <span className="text-[11px] font-black uppercase tracking-[0.4em] italic text-white/80">Nổi Bật</span>
            </motion.div>

            <div className="space-y-4">
               <h1 className="text-6xl sm:text-7xl md:text-9xl font-black font-headline leading-[0.85] tracking-tighter text-white uppercase italic italic shadow-2xl skew-x-[-2deg]">
                 {currentMovie.title}
               </h1>
               <div className="flex flex-wrap items-center gap-6 text-[14px] font-black uppercase italic tracking-widest text-white/40">
                 <span className="flex items-center gap-2"><Star className="w-4 h-4 fill-primary text-primary" /> {currentMovie.imdbRating || currentMovie.tmdbRating || "9.8"}</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                 <span className="text-primary">{currentMovie.year}</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                 <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white/60">{currentMovie.quality}</span>
               </div>
            </div>

            <p className="hidden md:block text-lg text-white/50 max-w-2xl font-medium leading-relaxed italic line-clamp-3">
              {currentMovie.overview || "Trải nghiệm độ phân giải 4K HDR cùng hệ thống âm thanh vòm Dolby Atmos 2026. Một tác phẩm điện ảnh đỉnh cao được tinh chỉnh riêng cho cộng đồng Hồ Phim."}
            </p>

            <div className="flex items-center gap-6 mt-6">
              <Link href={`/phim/${currentMovie.slug}`} className="flex-1 md:flex-none">
                <Button
                  size="lg"
                  className="h-20 px-16 text-[18px] font-black italic uppercase italic tracking-widest rounded-[32px] gap-4 bg-primary text-white shadow-cinematic-2xl hover:shadow-primary/40 transition-all hover:scale-110 active-depth group"
                >
                  <Play className="w-8 h-8 fill-current group-hover:scale-125 transition-transform duration-500" />
                  XEM NGAY
                </Button>
              </Link>
              
              <button 
                onClick={() => setIsPlaylistModalOpen(true)}
                className="w-20 h-20 glass-pro rounded-[32px] flex items-center justify-center text-white hover:bg-primary hover:text-white hover:scale-110 active-depth transition-all shadow-cinematic-xl border border-white/10 group"
              >
                <Plus className="w-10 h-10 stroke-[3px] group-hover:rotate-180 transition-transform duration-700" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bento Showcase Thumbnail Navigation */}
      <div className="absolute right-12 bottom-32 z-30 hidden xl:flex items-center gap-6">
        {movies.slice(0, 4).map((movie, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`relative w-28 h-40 rounded-[28px] overflow-hidden border-2 transition-all duration-1000 active-depth group ${
              idx === currentIndex 
                ? "border-primary shadow-cinematic-2xl scale-110 -translate-y-4" 
                : "border-white/5 opacity-30 hover:opacity-100 hover:scale-110"
            }`}
          >
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              sizes="200px"
              quality={80}
              className={`object-cover transition-all duration-700 ${idx === currentIndex ? "scale-100" : "scale-110 grayscale-[80%] group-hover:grayscale-0 group-hover:scale-100"}`}
              unoptimized={!movie.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
            />
            <div className={`absolute inset-0 transition-opacity duration-700 ${idx === currentIndex ? "bg-primary/20 backdrop-blur-[2px]" : "bg-black/40 opacity-100 group-hover:opacity-0"}`} />
            {idx === currentIndex && (
              <motion.div layoutId="active-hero-tab" className="absolute inset-0 ring-4 ring-primary ring-inset rounded-[28px]" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Navigation Precision Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full glass-pro text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110 active-depth flex items-center justify-center border border-white/10"
      >
        <ChevronLeft className="w-8 h-8 stroke-[3px]" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full glass-pro text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:scale-110 active-depth flex items-center justify-center border border-white/10"
      >
        <ChevronRight className="w-8 h-8 stroke-[3px]" />
      </button>

      {/* Intelligence Timeline Progress */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5 z-40 overflow-hidden">
        <motion.div 
          key={currentIndex}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 10, ease: "linear" }}
          className="h-full bg-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.8)] relative"
        >
           <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
        </motion.div>
      </div>

      <PlaylistModal 
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        movieSlug={currentMovie.slug}
        movieTitle={currentMovie.title}
        posterUrl={currentMovie.thumbUrl || currentMovie.posterUrl}
      />
    </section>
  );
}


