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
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent hidden lg:block" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-6 lg:px-12 pb-32 md:pb-16 w-full transform-gpu">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-4 max-w-4xl"
          >
            <div className="space-y-4">
               <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                 {currentMovie.title}
               </h1>
               <div className="flex items-center gap-4 text-sm font-bold text-white/60">
                 <span className="flex items-center gap-1.5"><Star size={16} fill="currentColor" className="text-yellow-400" /> {currentMovie.imdbRating || currentMovie.tmdbRating || "8.5"}</span>
                 <span className="w-1 h-1 rounded-full bg-white/20" />
                 <span>{currentMovie.year}</span>
                 <span className="w-1 h-1 rounded-full bg-white/20" />
                 <span className="px-2 py-0.5 backdrop-blur-md bg-white/10 rounded-md text-[10px] text-white/80">{currentMovie.quality}</span>
               </div>
            </div>

            {currentMovie.overview && (
              <p className="text-base text-white/70 max-w-2xl font-medium leading-relaxed line-clamp-2">
                {currentMovie.overview}
              </p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <Link href={isXX ? `/${TOPXX_PATH}/watch/${currentMovie.slug}` : `/xem/${currentMovie.slug}`}>
                <Button
                  size="lg"
                  className={cn(
                    "h-12 px-8 rounded-full gap-2 shadow-lg hover:scale-105 transition-transform",
                    isXX ? "bg-yellow-500 text-black" : "bg-primary text-white"
                  )}
                >
                  <Play size={20} fill="currentColor" strokeWidth={0} />
                  Xem Ngay
                </Button>
              </Link>
              
              <button 
                onClick={() => setIsPlaylistModalOpen(true)}
                className="w-12 h-12 rounded-full backdrop-blur-sm md:backdrop-blur-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-md"
              >
                <Plus size={24} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Thumbnails for TopXX */}
      {isXX && (
        <div className="absolute right-6 md:right-12 bottom-6 md:bottom-12 z-30 flex flex-nowrap items-center justify-end gap-3 max-w-[90vw] overflow-x-auto no-scrollbar pb-4 md:pb-0">
          {movies.slice(0, 10).map((movie, idx) => (
            <button
              key={movie.slug}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={cn(
                "relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 aspect-square rounded-full overflow-hidden transition-all duration-500 border-2 shadow-2xl group/thumb",
                currentIndex === idx 
                  ? "border-yellow-500 scale-110 z-10 shadow-yellow-500/40" 
                  : "border-white/20 opacity-40 hover:opacity-100 hover:border-white/40"
              )}
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.title} 
                fill
                className="w-full h-full object-cover scale-110 group-hover/thumb:scale-125 transition-transform duration-500"
                sizes="56px"
              />
              <div className={cn(
                "absolute inset-0 bg-yellow-500/20 transition-opacity duration-500",
                currentIndex === idx ? "opacity-100" : "opacity-0"
              )} />
            </button>
          ))}
        </div>
      )}

      {/* Default Navigation Controls (only if not XX) */}
      {!isXX && (
        <div className="absolute right-8 bottom-8 z-30 flex gap-2">
          <button 
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 group-hover:border-white/30"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 group-hover:border-white/30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

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
