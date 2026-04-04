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
          <img
            src={currentMovie.thumbUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent hidden lg:block" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-6 lg:px-12 pb-16 w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-4 max-w-4xl"
          >
            <div className="flex items-center gap-2 px-3 py-1 backdrop-blur-xl bg-white/20 rounded-full shadow-sm">
               <Sparkles size={12} className={isXX ? "text-yellow-500" : "text-primary"} />
               <span className="text-[10px] font-bold uppercase tracking-wider text-white">{isXX ? "TOPXX PREMIUM" : "Nổi bật"}</span>
            </div>

            <div className="space-y-2">
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

            <p className="hidden md:block text-base text-white/70 max-w-2xl font-medium leading-relaxed line-clamp-2">
              {currentMovie.overview || "Trải nghiệm điện ảnh đỉnh cao với chất lượng 4K HDR tuyệt mỹ duy nhất tại Hồ Phim."}
            </p>

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
                className="w-12 h-12 rounded-full backdrop-blur-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-md"
              >
                <Plus size={24} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute right-8 bottom-8 z-30 flex gap-2">
        <button 
          onClick={prevSlide}
          className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={nextSlide}
          className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
        >
          <ChevronRight size={20} />
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
