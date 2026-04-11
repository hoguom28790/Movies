"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X, Star } from 'lucide-react';
import { WatchlistBtn } from './WatchlistBtn';
import { cn } from '@/lib/utils';
import { TOPXX_PATH } from "@/lib/constants";

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
  isXX?: boolean;
}

export function MovieCard({ 
  title, slug, posterUrl, year, quality, episodeText, subText, originalTitle, progress, progressText, customHref, score, onDelete, index = 0, isXX = false
}: MovieCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const safeSlug = slug || "";
  const linkHref = customHref || (safeSlug.startsWith('/') ? safeSlug : (isXX ? `/${TOPXX_PATH}/movie/${safeSlug}` : `/xem/${safeSlug}`));
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
      className={cn(
        "group relative flex flex-col gap-3 reveal-item will-change-scroll", 
        isVisible && "is-visible",
        isXX ? "hover:z-10" : ""
      )}
    >
      <Link 
        href={linkHref} 
        className={cn(
          "movie-card relative w-full overflow-hidden rounded-[16px] bg-surface transition-all duration-500 shadow-md group-hover:shadow-xl group-hover:scale-[1.02] active:scale-[0.98]",
          isXX ? "aspect-[7/10]" : "aspect-[2/3]"
        )}
      >
        <div className="relative w-full h-full">
          <Image 
            src={imgError || !posterUrl ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900' viewBox='0 0 600 900'><rect width='100%25' height='100%25' fill='%231a1a1a'/><text x='50%25' y='50%25' font-family='sans-serif' font-weight='bold' font-size='32' fill='%23333' text-anchor='middle' dy='.3em'>Loading...</text></svg>" : posterUrl} 
            alt={title} 
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className={cn(
               "object-cover transition-transform duration-700 group-hover:scale-110",
               imgError && "opacity-50 grayscale"
            )}
            unoptimized={false}
            priority={index < 4}
            onError={() => setImgError(true)}
          />
        </div>
        
        {/* Apple HIG Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Superior Badges System */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20 pointer-events-none">
          {score && !isXX && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-md bg-white/10 rounded-full shadow-sm">
               <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
               <span className="text-[10px] font-bold text-white">{score}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-2 items-end ml-auto">
            {(quality || episodeText) && (
              <div className="flex gap-2">
                 {quality && (
                   <div className="px-2 py-0.5 backdrop-blur-md bg-black/40 text-white rounded-full text-[9px] font-bold uppercase tracking-wider">
                     {quality}
                   </div>
                 )}
                 {year && !isXX && (
                   <div className="px-2 py-0.5 backdrop-blur-md bg-black/30 text-white/90 rounded-full text-[9px] font-bold">
                     {year}
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Play Icon - Apple SF Symbol style */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
          <div className="p-4 rounded-full backdrop-blur-xl bg-white/20 text-white shadow-lg">
            <Play size={24} fill="currentColor" strokeWidth={0} />
          </div>
        </div>

        {/* Apple Style Progress Bar */}
        {progress !== undefined && (
          <div className="absolute bottom-0 inset-x-0 p-3 z-20">
             <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(0,122,255,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.max(2, progress)}%` }}
                />
             </div>
          </div>
        )}

        {/* Destruction Control (Delete) */}
        {onDelete && (
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }}
             className="absolute top-2 right-2 md:top-3 md:right-3 z-40 w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-full backdrop-blur-xl bg-black/60 md:bg-black/40 text-white transition-all active:scale-90 hover:bg-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 touch-manipulation shadow-2xl"
             aria-label="Xóa khỏi lịch sử"
           >
              <X size={20} strokeWidth={2.5} />
           </button>
        )}

        {/* Floating Save Button */}
        <div className="absolute bottom-3 right-3 z-40">
           <WatchlistBtn 
             movieSlug={!isXX ? slug : undefined}
             movieCode={isXX ? slug : undefined}
             movieTitle={title} 
             posterUrl={posterUrl} 
             variant="compact" 
             isXX={isXX}
           />
        </div>
      </Link>
      
      {/* Title & Metadata */}
      <div className="flex flex-col px-1 gap-0.5">
        <Link 
          href={linkHref}
          className="text-sm font-bold line-clamp-1 tracking-tight text-foreground hover:text-primary transition-colors"
          title={title}
        >
          {title}
        </Link>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-medium text-foreground-secondary line-clamp-1">
             {originalTitle || (isXX ? year : subText) || ""}
           </span>
        </div>
      </div>
    </div>
  );
}
