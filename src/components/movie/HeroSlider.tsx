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
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <Image
            src={currentMovie.thumbUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            fill
            priority
            className="absolute inset-0 w-full h-full object-cover"
            sizes="100vw"
          />
          {/* Universal Overlay: Guarantee high contrast for white text on any background */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-black via-black/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content Container */}
      <div className="container relative z-20 mx-auto px-4 lg:px-12 h-full flex flex-col justify-end pb-24 md:pb-32">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 w-full"
          >
            {/* Portrait Poster (Standing Card) */}
            <div className="relative hidden md:block w-48 lg:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/20 transform-gpu hover:scale-105 transition-transform duration-500 flex-shrink-0">
               <Image 
                 src={currentMovie.posterUrl} 
                 alt={currentMovie.title}
                 fill
                 className="object-cover"
                 unoptimized={false}
                 sizes="(max-width: 1024px) 192px, 256px"
               />
            </div>

            {/* Movie Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 max-w-3xl">
               <div className="space-y-1">
                  {/* FORCED WHITE TEXT: Prevents light theme variables from turning text black over dark posters */}
                  <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold tracking-tight !text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                    {currentMovie.title}
                  </h1>
                  
                  {currentMovie.originalTitle && (
                    <h2 className="text-base md:text-xl font-semibold text-[#fbc02d] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {currentMovie.originalTitle}
                    </h2>
                  )}
               </div>

               <div className="flex items-center flex-wrap justify-center md:justify-start gap-1.5 md:gap-2">
                 <span className="flex items-center gap-1 px-2 py-0.5 bg-black/40 border border-[#fbc02d]/30 rounded backdrop-blur-md text-[10px] md:text-xs font-bold text-[#fbc02d]">
                    <Star size={10} fill="currentColor" /> {currentMovie.imdbRating || currentMovie.tmdbRating || "8.5"}
                 </span>
                 <span className="px-2 py-0.5 bg-black/40 border border-white/10 rounded backdrop-blur-md text-[10px] md:text-xs font-bold !text-white uppercase">{currentMovie.quality || "HD"}</span>
                 <span className="px-2 py-0.5 bg-black/40 border border-white/10 rounded backdrop-blur-md text-[10px] md:text-xs font-bold !text-white whitespace-nowrap">{(currentMovie as any).type || "Phim"}</span>
                 <span className="px-2 py-0.5 bg-[#d32f2f]/80 border border-[#d32f2f]/40 rounded backdrop-blur-md text-[10px] md:text-xs font-bold !text-white uppercase whitespace-nowrap">
                    {(currentMovie as any).episodeCurrent && (currentMovie as any).episodeTotal 
                      ? `${(currentMovie as any).episodeCurrent}/${(currentMovie as any).episodeTotal}` 
                      : currentMovie.status || "Full"}
                 </span>
                 <span className="px-2 py-0.5 bg-white/10 border border-white/10 rounded backdrop-blur-md text-[10px] md:text-xs font-bold bg-black/40 !text-white/90">{(currentMovie as any).age || "13+"}</span>
                 {currentMovie.year && (
                   <span className="px-2 py-0.5 bg-black/40 border border-white/10 rounded backdrop-blur-md text-[10px] md:text-xs font-medium !text-white/80">{currentMovie.year}</span>
                 )}
               </div>

               {currentMovie.overview && (
                 <p className="hidden md:line-clamp-2 !text-white/80 text-base font-medium max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed">
                   {currentMovie.overview}
                 </p>
               )}

               <div className="flex items-center gap-4 mt-2">
                 <Link href={isXX ? `/${TOPXX_PATH}/watch/${currentMovie.slug}` : `/xem/${currentMovie.slug}`}>
                   <Button
                     size="lg"
                     className="h-12 px-10 rounded-lg bg-[#d32f2f] hover:bg-[#b71c1c] text-white border-0 shadow-[0_4px_15px_rgba(211,47,47,0.5)] transition-all font-bold gap-3 active:scale-95 group"
                   >
                     <Play size={20} fill="currentColor" strokeWidth={0} className="group-hover:scale-110 transition-transform" />
                     XEM PHIM
                   </Button>
                 </Link>
                 
                 <button 
                   onClick={() => setIsPlaylistModalOpen(true)}
                   className="w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all flex items-center justify-center active:scale-95"
                 >
                   <Plus size={24} />
                 </button>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Thumbnails - Positioned bottom-right to avoid overlap */}
      <div className="absolute right-4 md:right-12 bottom-6 md:bottom-12 z-30 flex items-center justify-end w-full pointer-events-none">
        <div className="flex flex-nowrap items-center gap-2 md:gap-3 px-4 max-w-[90vw] overflow-x-auto no-scrollbar scroll-smooth pointer-events-auto">
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
