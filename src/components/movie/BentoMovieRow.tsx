"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";

interface BentoMovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function BentoMovieRow({ title, movies, viewAllHref }: BentoMovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (movies.length === 0) return null;

  const featured = movies[0];
  const others = movies.slice(1, 10);

  return (
    <section className="mt-20 group/row select-none">
      <div className="px-6 lg:px-20 flex justify-between items-end mb-10 overflow-hidden">
        <div className="space-y-3">
           <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
                <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.5em] text-white/20 italic">Thịnh Hành</h3>
           </div>
           <h3 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-white uppercase italic leading-none">
             {title}
           </h3>
        </div>
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="group/btn h-14 px-8 glass-pro rounded-[24px] flex items-center gap-4 text-[11px] font-black uppercase italic tracking-[0.2em] text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all active-depth shadow-cinematic-xl"
          >
            KHÁM PHÁ THÊM <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform duration-500" />
          </Link>
        )}
      </div>

      <div 
        ref={rowRef}
        className="flex overflow-x-auto hide-scrollbar gap-8 px-6 lg:px-20 snap-x pb-12"
      >
        {/* Featured Large Card */}
        <motion.div 
          initial={{ opacity: 0, x: -50, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          className="flex-shrink-0 w-80 md:w-[420px] snap-start"
        >
          <Link 
            href={featured.slug.startsWith('/') ? featured.slug : `/phim/${featured.slug}`}
            className="relative group rounded-[48px] overflow-hidden aspect-[3/4] bg-[#0a0a0b] shadow-cinematic-2xl block border border-white/10 transition-all duration-1000 hover:shadow-primary/30 active-depth"
          >
            <Image 
              src={featured.posterUrl} 
              alt={featured.title} 
              fill
              className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-1000 group-hover:brightness-50" 
              unoptimized={!featured.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
            />
            
            <div className="absolute top-8 left-8 flex flex-col gap-4 z-20">
              <div className="flex gap-3">
                 <div className="px-5 py-2.5 glass-pro rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] italic">Đề Xuất</span>
                 </div>
                 <div className="px-5 py-2.5 bg-primary text-white text-[12px] font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/40 border border-primary/20">
                   <Star className="w-4 h-4 fill-current animate-spin-slow" /> 
                   {featured.tmdbRating ? featured.tmdbRating.toFixed(1) : "9.8"}
                 </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="absolute bottom-12 left-10 right-10">
               <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <p className="text-white font-black text-4xl md:text-5xl leading-none tracking-tight uppercase italic skew-x-[-4deg] line-clamp-2 drop-shadow-[0_20px_50px_rgba(0,0,0,1)] group-hover:text-primary transition-colors duration-500">{featured.title}</p>
                    <p className="text-white/40 font-black text-[12px] uppercase tracking-[0.4em] italic group-hover:text-white transition-colors">Original Noir Series • {featured.year}</p>
                  </div>
                  <div className="flex items-center gap-5 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                     <div className="h-[1px] flex-1 bg-white/10" />
                     <span className="text-primary text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap">Watch Special Cut</span>
                  </div>
               </motion.div>
            </div>
          </Link>
        </motion.div>

        {/* Standard Bento Cards */}
        {others.map((movie, idx) => (
          <motion.div 
            key={movie.slug} 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="flex-shrink-0 w-52 md:w-64 snap-start"
          >
            <Link 
              href={movie.slug.startsWith('/') ? movie.slug : `/phim/${movie.slug}`}
              className="relative group rounded-[40px] overflow-hidden aspect-[2/3] bg-[#0a0a0b] block border border-white/5 shadow-cinematic-xl hover:border-primary/40 transition-all duration-700 hover:shadow-primary/30 active-depth"
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.title} 
                fill
                className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-50 transition-all duration-1000" 
                unoptimized={!movie.posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
              />
              <div className="absolute top-5 right-5 z-20">
                 <div className="px-3 py-1.5 glass-pro rounded-xl border border-white/10 flex items-center gap-2 shadow-2xl">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-[11px] font-black text-white/80 italic">{movie.tmdbRating ? movie.tmdbRating.toFixed(1) : "8.5"}</span>
                 </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute bottom-8 left-8 right-8 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                <p className="text-white font-black text-[17px] tracking-tight leading-none line-clamp-2 uppercase italic group-hover:text-primary transition-colors mb-2">{movie.title}</p>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                   <span className="text-white/30 text-[9px] font-black uppercase tracking-widest italic bg-white/5 px-2 py-1 rounded-md">{movie.year}</span>
                   <span className="text-primary text-[9px] font-black uppercase tracking-widest italic">{movie.quality || "4K DOLBY VISION"}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

