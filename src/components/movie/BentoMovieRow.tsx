"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

interface BentoMovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function BentoMovieRow({ title, movies, viewAllHref }: BentoMovieRowProps) {
  if (movies.length === 0) return null;

  const featured = movies[0];
  const others = movies.slice(1, 10);

  return (
    <section className="mt-16 group/row select-none">
      <div className="px-6 lg:px-12 flex justify-between items-end mb-8">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-secondary">Xu hướng</h3>
           </div>
           <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
             {title}
           </h2>
        </div>
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-bold text-primary hover:opacity-80 transition-all"
          >
            Khám phá thêm <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-6 px-6 lg:px-12 pb-8">
        {/* Featured Large Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex-shrink-0 w-80 md:w-[400px]"
        >
          <Link 
            href={featured.slug.startsWith('/') ? featured.slug : `/xem/${featured.slug}`}
            className="relative group rounded-[32px] overflow-hidden aspect-[3/4] bg-surface shadow-lg block transition-all duration-500 hover:shadow-xl"
          >
            <Image 
              src={featured.posterUrl} 
              alt={featured.title} 
              fill
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              unoptimized={!featured.posterUrl?.includes('tmdb.org')}
              sizes="(max-width: 768px) 320px, 400px"
            />
            
            <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
               <div className="px-3 py-1 backdrop-blur-md bg-white/20 rounded-full flex items-center gap-2 shadow-sm">
                  <Sparkles size={12} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Đề xuất</span>
               </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 z-20">
               <div className="p-6 backdrop-blur-2xl bg-black/40 rounded-[24px] border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold text-2xl md:text-3xl tracking-tight leading-tight line-clamp-1">{featured.title}</p>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                       <Star size={14} fill="currentColor" />
                       {featured.tmdbRating ? featured.tmdbRating.toFixed(1) : "8.5"}
                    </div>
                  </div>
                  <p className="text-white/60 text-xs font-medium">{featured.year} • {featured.quality || "4K Ultra HD"}</p>
               </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          </Link>
        </motion.div>

        {/* Standard Bento Cards */}
        {others.map((movie, idx) => (
          <motion.div 
            key={movie.slug} 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="flex-shrink-0 w-52 md:w-60"
          >
            <Link 
              href={movie.slug.startsWith('/') ? movie.slug : `/xem/${movie.slug}`}
              className="relative group rounded-[24px] overflow-hidden aspect-[2/3] bg-surface block shadow-md hover:shadow-lg transition-all duration-500"
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.title} 
                fill
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                unoptimized={!movie.posterUrl?.includes('tmdb.org')}
                sizes="(max-width: 768px) 208px, 240px"
              />
              <div className="absolute top-4 right-4 z-20">
                 <div className="px-2 py-1 backdrop-blur-md bg-foreground/10 rounded-full flex items-center gap-1.5 shadow-sm text-foreground">
                    <Star size={10} fill="currentColor" className="text-yellow-400" />
                    <span className="text-[10px] font-bold">{movie.tmdbRating ? movie.tmdbRating.toFixed(1) : "8.5"}</span>
                 </div>
              </div>
              <div className="absolute inset-x-3 bottom-3 z-20">
                <div className="p-3 backdrop-blur-xl bg-foreground/10 rounded-[18px] border border-white/5">
                  <p className="text-foreground font-bold text-sm tracking-tight leading-tight line-clamp-1 mb-1">{movie.title}</p>
                  <p className="text-foreground/60 text-[10px] font-medium">{movie.year}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
