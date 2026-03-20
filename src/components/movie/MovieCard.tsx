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
}

export function MovieCard({ title, slug, posterUrl, year, quality, episodeText, subText, originalTitle }: MovieCardProps) {
  return (
    <div className="group relative flex flex-col gap-2 transition-all duration-300">
      <Link href={`/movie/${slug}`} className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/40">
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
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
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="bg-white/15 backdrop-blur-sm rounded-full p-3.5">
            <Play className="h-6 w-6 text-white fill-white translate-x-0.5" />
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col gap-0.5 px-0.5 mt-1">
        <Link 
          href={`/movie/${slug}`} 
          className="text-[12px] sm:text-[13px] font-semibold text-white/90 hover:text-white line-clamp-2 transition-colors leading-[1.3]" 
          title={title}
        >
          {title}
        </Link>
        {originalTitle && (
          <span className="text-[12px] sm:text-[11px] text-white/30 line-clamp-1">{originalTitle}</span>
        )}
      </div>
    </div>
  );
}
