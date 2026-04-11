"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Star, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

interface BentoMovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function BentoMovieRow({ title, movies, viewAllHref }: BentoMovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  if (movies.length === 0) return null;

  const featured = movies[0];
  const others = movies.slice(1, 10);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const offset = clientWidth * 0.8;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - offset : scrollLeft + offset,
      behavior: 'smooth'
    });
  };

  return (
    <section className="mt-16 group/row select-none">
      <div className="container mx-auto px-6 lg:px-12 mb-8 flex items-end justify-between">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-secondary">Xu hướng</h3>
           </div>
           <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground italic uppercase">
             {title}
           </h2>
        </div>
        
        <div className="flex items-center gap-4">
           {viewAllHref && (
             <Link 
               href={viewAllHref}
               className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:opacity-80 transition-all uppercase tracking-widest mr-4"
             >
               Khám phá thêm <ChevronRight size={16} />
             </Link>
           )}
           <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full border border-foreground/5 bg-foreground/[0.03] backdrop-blur-md flex items-center justify-center text-foreground/40 hover:text-primary hover:bg-foreground/5 transition-all active:scale-90"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full border border-foreground/5 bg-foreground/[0.03] backdrop-blur-md flex items-center justify-center text-foreground/40 hover:text-primary hover:bg-foreground/5 transition-all active:scale-90"
              >
                <ChevronRight size={20} />
              </button>
           </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar gap-6 pb-8 scroll-smooth px-[max(1.5rem,calc((100vw-1280px)/2+1.5rem))] lg:px-[max(3rem,calc((100vw-1280px)/2+3rem))]"
        >
          {/* Featured Large Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-shrink-0 w-80 md:w-[400px]"
          >
            <Link 
              href={featured.slug.startsWith('/') ? featured.slug : `/xem/${featured.slug}`}
              className="relative group rounded-[40px] overflow-hidden aspect-[3/4] bg-surface shadow-2xl block transition-all duration-700 hover:shadow-primary/20"
            >
              <Image 
                src={featured.posterUrl} 
                alt={featured.title} 
                fill
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                sizes="(max-width: 768px) 320px, 400px"
              />
              
              <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
                 <div className="px-4 py-1.5 backdrop-blur-2xl bg-white/20 rounded-full flex items-center gap-2 shadow-2xl border border-white/10">
                    <Sparkles size={12} className="text-white fill-current" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Đề xuất</span>
                 </div>
              </div>

              <div className="absolute inset-x-6 bottom-6 z-20">
                 <div className="p-8 backdrop-blur-3xl bg-black/40 rounded-[32px] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-black text-2xl md:text-3xl tracking-tighter leading-tight line-clamp-1 uppercase italic">{featured.title}</p>
                      <div className="flex items-center gap-1.5 text-primary-light font-black text-base italic">
                         <Star size={16} fill="currentColor" />
                         {featured.tmdbRating ? featured.tmdbRating.toFixed(1) : "8.5"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-white px-2 py-0.5 rounded bg-primary italic uppercase">{featured.year}</span>
                       <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{featured.quality || "4K UHD"}</span>
                    </div>
                 </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </Link>
          </motion.div>

          {/* Standard Bento Cards */}
          {others.map((movie, idx) => (
            <motion.div 
              key={movie.slug} 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex-shrink-0 w-56 md:w-64"
            >
              <Link 
                href={movie.slug.startsWith('/') ? movie.slug : `/xem/${movie.slug}`}
                className="relative group rounded-[32px] overflow-hidden aspect-[2/3] bg-surface block shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                <Image 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  fill
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  sizes="(max-width: 768px) 224px, 256px"
                />
                <div className="absolute top-5 right-5 z-20">
                   <div className="px-3 py-1 backdrop-blur-2xl bg-black/60 rounded-full flex items-center gap-1.5 shadow-2xl text-white border border-white/10">
                      <Star size={12} fill="currentColor" className="text-primary" />
                      <span className="text-[10px] font-black italic">{movie.tmdbRating ? movie.tmdbRating.toFixed(1) : "8.5"}</span>
                   </div>
                </div>
                <div className="absolute inset-x-4 bottom-4 z-20">
                  <div className="p-5 backdrop-blur-3xl bg-black/40 rounded-[24px] border border-white/10">
                    <p className="text-white font-black text-base tracking-tighter leading-tight line-clamp-1 mb-1 uppercase italic">{movie.title}</p>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{movie.year}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </Link>
            </motion.div>
          ))}
          {/* Spacer to fix right alignment at end of scroll */}
          <div className="flex-shrink-0 w-6 lg:w-12" />
        </div>
      </div>
    </section>
  );
}
