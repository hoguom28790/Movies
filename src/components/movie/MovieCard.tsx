"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { WatchlistBtn } from './WatchlistBtn';

interface MovieCardProps {
  title: string;
  slug: string;
  posterUrl: string;
  year?: string;
  quality?: string;
  episodeText?: string;
  subText?: string;
  originalTitle?: string;
  progress?: number;
  progressText?: string;
  customHref?: string;
  score?: string | number;
  onDelete?: (e: React.MouseEvent) => void;
  index?: number;
}

export function MovieCard({ 
  title, slug, posterUrl, year, quality, episodeText, subText, originalTitle, progress, progressText, customHref, score, onDelete, index = 0
}: MovieCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const linkHref = customHref || (slug.startsWith('/') ? slug : `/xem/${slug}`);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col gap-4"
    >
      <Link 
        href={`/xem/${slug}`} 
        className="relative aspect-[2/3] w-full overflow-hidden rounded-[32px] bg-[#141416] transition-all duration-700 hover:shadow-primary/20 hover:shadow-2xl active-depth border border-white/5"
      >
        <div className="relative w-full h-full">
          <Image 
            src={imgError || !posterUrl ? "https://placehold.co/600x900/111111/4ade80?text=No+Poster" : posterUrl} 
            alt={title} 
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-[-1deg] group-hover:brightness-50"
            unoptimized={posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i) ? false : true}
            onError={() => setImgError(true)}
            priority={false}
          />
        </div>
        {!posterUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
             <span className="text-xs font-black text-white/20 uppercase italic tracking-widest">{title}</span>
          </div>
        )}
        
        {/* Cinematic Intelligent Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute inset-0 ring-1 ring-white/10 ring-inset rounded-[32px] group-hover:ring-primary/40 transition-all duration-700" />
        
        {/* Superior Badges System */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          {score && (
            <motion.div initial={{ x: -10, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 px-3 py-1.5 glass-pro rounded-2xl border border-white/10 shadow-xl overflow-hidden">
               <Star className="w-3.5 h-3.5 fill-primary text-primary" />
               <span className="text-[10px] font-black italic uppercase tracking-widest text-white">{score}</span>
            </motion.div>
          )}
          
          <div className="flex flex-col gap-2 items-end">
            {(quality || episodeText) && (
              <div className="flex gap-2">
                 {quality && (
                   <div className="px-2.5 py-1 glass-pro rounded-xl text-[9px] font-black text-white/90 uppercase tracking-[0.2em] border border-white/10">
                     {quality}
                   </div>
                 )}
                 {year && (
                   <div className="px-2.5 py-1 glass-pro rounded-xl text-[9px] font-black text-white/50 border border-white/10">
                     {year}
                   </div>
                 )}
              </div>
            )}
            {episodeText && !episodeText.includes('Tập 0') && !episodeText.includes('Episode 0') && (
               <div className="px-4 py-1.5 bg-primary/90 backdrop-blur-3xl rounded-xl text-[10px] font-black text-white shadow-cinematic-lg uppercase italic tracking-widest border border-primary/20">
                 {episodeText}
               </div>
            )}
          </div>
        </div>

        {/* Play Intelligence Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-50 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
          <div className="bg-primary/20 backdrop-blur-3xl rounded-full p-6 border border-primary/30 shadow-primary/40 shadow-2xl transition-transform group-hover:scale-110">
            <Play className="h-10 w-10 text-white fill-current translate-x-1" />
          </div>
        </div>

        {/* Home/History Progress Bar */}
        {progress !== undefined && (
          <div className="absolute bottom-0 inset-x-0 h-2 bg-black/80 backdrop-blur-3xl z-20 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.max(2, progress)}%` }}
               transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
               className="h-full bg-primary shadow-[0_0_25px_oklch(65%_0.3_260)] relative" 
             >
                <div className="absolute right-0 top-0 h-full w-12 bg-white/30 blur-[6px] animate-pulse" />
             </motion.div>
             {progressText && (
                <div className="absolute bottom-3 left-4 px-2 py-0.5 glass-pro bg-primary/60 rounded-md text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap drop-shadow-[0_2px_15px_rgba(0,0,0,1)] border border-primary/20 z-30 shadow-2xl">
                   {progressText}
                </div>
             )}
          </div>
        )}

        {/* Destruction Control (Delete) */}
        {onDelete && (
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }}
             className="absolute top-4 right-4 z-40 w-12 h-12 rounded-[20px] bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/40 hover:bg-red-500 hover:text-white hover:border-red-400 hover:scale-110 active-depth transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
           >
              <X className="w-6 h-6 stroke-[3px]" />
           </button>
        )}

        {/* Global Save Control (Floating Premium Button) */}
        <div className="absolute bottom-4 right-4 z-40 transition-all duration-700 ease-out pointer-events-auto">
           <WatchlistBtn 
             movieSlug={slug} 
             movieTitle={title} 
             posterUrl={posterUrl} 
             variant="compact" 
           />
        </div>
      </Link>
      
      {/* Title & Metadata (Premium Layout) */}
      <div className="flex flex-col gap-1.5 px-2 mt-2">
        <Link 
          href={linkHref}
          className="text-[17px] font-black text-white/90 group-hover:text-primary line-clamp-2 transition-all duration-500 leading-tight uppercase italic tracking-tight font-headline group-hover:translate-x-1" 
          title={title}
        >
          {title}
        </Link>
        <div className="flex items-center gap-3 overflow-hidden">
           {originalTitle && (
            <span className="text-[10px] font-black text-white/20 line-clamp-1 italic uppercase tracking-[0.2em]">{originalTitle}</span>
           )}
           {subText && (
            <span className="flex-shrink-0 text-[9px] font-black text-primary/60 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{subText}</span>
           )}
        </div>
      </div>
    </motion.div>
  );
}


