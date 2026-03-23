"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComicCardProps {
  title: string;
  slug: string;
  posterUrl: string;
  latestChapter?: string;
  statusText?: string;
  originalTitle?: string;
  score?: string | number;
  index?: number;
}

export function ComicCard({ 
  title, slug, posterUrl, latestChapter, statusText, originalTitle, score, index = 0 
}: ComicCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col gap-4 select-none"
    >
      <Link 
        href={`/truyen/${slug}`} 
        className="relative aspect-[2/3] w-full overflow-hidden rounded-[32px] bg-[#141416] transition-all duration-700 hover:shadow-[#ef4444]/20 hover:shadow-2xl active-depth border border-white/5"
      >
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
          className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-[1deg] group-hover:brightness-50"
          unoptimized={true}
          priority={false}
        />
        
        {/* Cinematic Intelligent Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute inset-0 ring-1 ring-white/10 ring-inset rounded-[32px] group-hover:ring-[#ef4444]/40 transition-all duration-700" />
        
        {/* Superior Badges System */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          {latestChapter && (
            <motion.div initial={{ x: -10, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 px-3 py-1.5 glass-pro rounded-2xl border border-white/10 shadow-xl overflow-hidden">
               <Sparkles className="w-3.5 h-3.5 text-[#ef4444] animate-pulse" />
               <span className="text-[10px] font-black italic uppercase tracking-widest text-white">{latestChapter}</span>
            </motion.div>
          )}
          
          <div className="flex flex-col gap-2 items-end">
            {(statusText || score) && (
              <div className="flex gap-2">
                 {score && (
                   <div className="px-2.5 py-1 glass-pro rounded-xl text-[9px] font-black text-white/90 uppercase tracking-[0.2em] border border-white/10 flex items-center gap-1">
                     <Star className="w-3 h-3 fill-[#fbbf24] text-[#fbbf24]" />
                     {score}
                   </div>
                 )}
                 {statusText && (
                   <div className="px-2.5 py-1 glass-pro rounded-xl text-[9px] font-black text-white/50 border border-white/10 italic">
                     {statusText}
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Read Intelligence Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-50 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
          <div className="bg-[#ef4444]/20 backdrop-blur-3xl rounded-full p-6 border border-[#ef4444]/30 shadow-[#ef4444]/40 shadow-2xl transition-transform group-hover:scale-110">
            <BookOpen className="h-10 w-10 text-white fill-current translate-x-1" />
          </div>
        </div>
      </Link>
      
      {/* Title & Metadata (Premium Layout) */}
      <div className="flex flex-col gap-1.5 px-2 mt-2">
        <Link 
          href={`/truyen/${slug}`} 
          className="text-[17px] font-black text-white/90 group-hover:text-[#ef4444] line-clamp-2 transition-all duration-500 leading-tight uppercase italic tracking-tight font-headline group-hover:translate-x-1" 
          title={title}
        >
          {title}
        </Link>
        <div className="flex items-center gap-3 overflow-hidden">
           {originalTitle && (
            <span className="text-[10px] font-black text-white/20 line-clamp-1 italic uppercase tracking-[0.2em]">{originalTitle}</span>
           )}
        </div>
      </div>
    </motion.div>
  );
}

