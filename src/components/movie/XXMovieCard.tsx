import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface XXMovieCardProps {
  title: string;
  slug: string;
  posterUrl: string;
  year?: string;
  quality?: string;
  progress?: number;
  progressText?: string;
  onDelete?: (e: React.MouseEvent) => void;
}

export function XXMovieCard({ 
  title, slug, posterUrl, year, quality, progress, progressText, onDelete 
}: XXMovieCardProps) {
  const [imgError, setImgError] = React.useState(false);
  return (
    <div className="group relative flex flex-col gap-3 transition-all duration-500 hover:z-10">
      <Link 
        href={`/xem/${slug}`} 
        className="relative aspect-[7/10] w-full overflow-hidden rounded-[32px] bg-surface transition-all duration-700 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] border border-white/5 active:scale-95"
      >
        <div className="relative w-full h-full">
          <Image 
            src={posterUrl ? posterUrl : "https://placehold.co/600x900/111111/4ade80?text=No+Poster"}
            alt={title} 
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
            className="object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-90 group-hover:opacity-100"
            unoptimized
            onError={() => setImgError(true)}
            priority={false}
          />
        </div>
        
        {/* Quality Badge */}
        {quality && (
          <div className="absolute top-4 right-4 rounded-xl bg-yellow-500 text-black px-3 py-1 text-[9px] font-black uppercase italic shadow-xl shadow-yellow-500/20 backdrop-blur-md z-10 transition-transform group-hover:scale-110">
            {quality}
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <div className="bg-yellow-500/10 backdrop-blur-2xl rounded-full p-6 border border-yellow-500/40 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-active:scale-90">
            <Play className="h-8 w-8 text-yellow-500 fill-yellow-500 translate-x-0.5" />
          </div>
        </div>

        {/* Home/History Progress Bar */}
        {progress !== undefined && (
          <div className="absolute bottom-0 inset-x-0 h-2 bg-black/80 backdrop-blur-3xl z-20 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.max(2, progress)}%` }}
               transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
               className="h-full bg-yellow-500 shadow-[0_0_25px_#fbbf24] relative" 
             >
                <div className="absolute right-0 top-0 h-full w-12 bg-white/30 blur-[6px] animate-pulse" />
             </motion.div>
             {progressText && (
                <div className="absolute bottom-3 left-4 px-2 py-0.5 glass-pro bg-yellow-400/60 rounded-md text-[9px] font-black text-yellow-600 uppercase tracking-widest whitespace-nowrap drop-shadow-[0_2px_15px_rgba(0,0,0,1)] border border-yellow-500/20 z-30 shadow-2xl">
                   {progressText}
                </div>
             )}
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
      
      <div className="flex flex-col gap-1.5 px-2 mt-1">
        <Link 
          href={`/xem/${slug}`} 
          className="text-[12px] font-black text-foreground/60 group-hover:text-yellow-500 uppercase italic tracking-tighter line-clamp-2 transition-all duration-300 leading-[1.2] drop-shadow-sm" 
          title={title}
        >
          {title}
        </Link>
        {year && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-foreground/20 uppercase italic tracking-[0.2em]">{year}</span>
            <div className="h-0.5 w-4 bg-foreground/5 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
