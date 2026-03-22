import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

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
  onDelete?: (e: React.MouseEvent) => void;
}

export function MovieCard({ 
  title, slug, posterUrl, year, quality, episodeText, subText, originalTitle, progress, onDelete 
}: MovieCardProps) {
  return (
    <div className="group relative flex flex-col gap-2 transition-all duration-300">
      <Link 
        href={`/phim/${slug}`} 
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 md:group-hover:-translate-y-1 md:group-hover:shadow-2xl md:group-hover:shadow-black/50 active:scale-[0.98] md:active:scale-100"
      >
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
          className="object-cover transition-transform duration-500 md:group-hover:scale-105"
          unoptimized={!posterUrl?.match(/amazon\.com|fanart\.tv|unsplash\.com|tmdb\.org/i)}
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Episode badge top-left */}
        {episodeText && (
          <div className="absolute top-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {episodeText}
          </div>
        )}

        {/* Quality badge top-right */}
        {quality && (
          <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/80">
            {quality}
          </div>
        )}

        {/* Sub text bottom-left */}
        {subText && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/70">
            {subText}
          </div>
        )}

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 md:group-hover:opacity-100 pointer-events-none">
          <div className="bg-white/15 backdrop-blur-sm rounded-full p-3.5">
            <Play className="h-6 w-6 text-white fill-white translate-x-0.5" />
          </div>
        </div>

        {/* Home/History Progress Bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20">
            <div 
              className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_var(--primary)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
      </Link>

      {/* Standardized Delete Button */}
      {onDelete && (
         <button 
           onClick={onDelete}
           className="delete-btn-premium !top-2 !right-2"
         >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         </button>
      )}
      
      <div className="flex flex-col gap-0.5 px-0.5 mt-1">
        <Link 
          href={`/phim/${slug}`} 
          className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-foreground/90 hover:text-foreground line-clamp-2 transition-colors leading-[1.4]" 
          title={title}
        >
          {title}
        </Link>
        {originalTitle && (
          <span className="text-[12px] sm:text-[13px] text-foreground/40 line-clamp-1">{originalTitle}</span>
        )}
      </div>
    </div>
  );
}
