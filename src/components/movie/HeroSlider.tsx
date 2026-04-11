"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Plus, Sparkles, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PlaylistModal } from "@/components/movie/PlaylistModal";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

interface HeroSliderProps {
  movies: Movie[];
  isXX?: boolean;
}

export function HeroSlider({ movies, isXX = false }: HeroSliderProps) {
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
    <section className="relative w-full h-[65vh] md:h-[80vh] flex items-end overflow-hidden mt-[-64px] group select-none">
      {/* Background Layer */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div 
          key={currentIndex}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <Image
            src={currentMovie.thumbUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            fill
            priority
            className="absolute inset-0 w-full h-full object-cover transform-gpu will-change-transform"
            sizes="100vw"
            quality={90}
          />
          {/* Ophim Style Overlays */}
          <div className="absolute inset-0 bg-[#0d0d0c]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c] via-[#0d0d0c]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 pb-20 md:pb-28 w-full transform-gpu flex flex-col items-center justify-end h-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center gap-4 max-w-4xl w-full"
          >
            <div className="flex flex-col items-center gap-3">
               <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                 {currentMovie.title}
               </h1>
               
               {currentMovie.originalTitle && (
                 <h2 className="text-lg md:text-xl font-medium text-[#fbc02d] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                   {currentMovie.originalTitle}
                 </h2>
               )}

               <div className="flex items-center flex-wrap justify-center gap-2 mt-2">
                 <span className="flex items-center gap-1.5 px-2 py-0.5 border border-white/20 rounded shadow-sm text-xs font-bold text-[#fbc02d]">
                    <Star size={12} fill="currentColor" /> {currentMovie.imdbRating || currentMovie.tmdbRating || "8.5"}
                 </span>
                 <span className="px-2 py-0.5 border border-white/20 rounded shadow-sm text-xs font-bold text-white uppercase">{currentMovie.quality || "HD"}</span>
                 <span className="px-2 py-0.5 border border-white/20 bg-white/10 rounded shadow-sm text-xs font-bold text-white uppercase">{currentMovie.status || "Hoàn tất"}</span>
                 {currentMovie.year && (
                   <span className="px-2 py-0.5 border border-white/20 rounded shadow-sm text-xs font-medium text-white/80">{currentMovie.year}</span>
                 )}
               </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Link href={isXX ? `/${TOPXX_PATH}/watch/${currentMovie.slug}` : `/xem/${currentMovie.slug}`}>
                <Button
                  size="lg"
                  className="h-11 px-8 rounded bg-[#d32f2f] hover:bg-[#b71c1c] text-white border-0 shadow-[0_4px_6px_rgba(211,47,47,0.4)] transition-all font-bold gap-2 active:scale-95"
                >
                  <Play size={18} fill="currentColor" strokeWidth={0} />
                  Xem Phim
                </Button>
              </Link>
              
              <button 
                onClick={() => setIsPlaylistModalOpen(true)}
                className="h-11 px-6 rounded bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 transition-all font-bold flex items-center gap-2 active:scale-95"
              >
                <Plus size={18} />
                Lưu
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Centered Navigation Thumbnails */}
      <div className="absolute inset-x-0 bottom-4 md:bottom-8 z-30 flex items-center justify-center w-full">
        <div className="flex flex-nowrap items-center gap-2 md:gap-3 px-4 max-w-full overflow-x-auto no-scrollbar scroll-smooth">
          {movies.slice(0, 10).map((movie, idx) => (
            <button
              key={movie.slug}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={cn(
                "relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 aspect-square rounded-full overflow-hidden transition-all duration-300 border-2 group/thumb",
                currentIndex === idx 
                  ? "border-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-[#d32f2f]/50" 
                  : "border-transparent opacity-50 hover:opacity-100 hover:border-white/50"
              )}
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.title} 
                fill
                className="w-full h-full object-cover transition-transform duration-500"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 z-20 flex items-center pl-2 md:pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 z-20 flex items-center pr-2 md:pr-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 backdrop-blur-sm"
        >
          <ChevronRight size={24} />
        </button>
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
