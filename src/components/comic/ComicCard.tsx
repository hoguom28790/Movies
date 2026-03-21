import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface ComicCardProps {
  title: string;
  slug: string;
  posterUrl: string;
  latestChapter?: string;
  statusText?: string;
  originalTitle?: string;
}

export function ComicCard({ title, slug, posterUrl, latestChapter, statusText, originalTitle }: ComicCardProps) {
  return (
    <div className="group relative flex flex-col gap-2 transition-all duration-300">
      <Link 
        href={`/truyen/${slug}`} 
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 md:group-hover:-translate-y-1 md:group-hover:shadow-2xl md:group-hover:shadow-black/50 active:scale-[0.98] md:active:scale-100"
      >
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
          className="object-cover transition-transform duration-500 md:group-hover:scale-105"
          unoptimized={true}
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Latest chapter badge top-left */}
        {latestChapter && (
          <div className="absolute top-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {latestChapter}
          </div>
        )}

        {/* Status badge top-right */}
        {statusText && (
          <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/80">
            {statusText}
          </div>
        )}

        {/* Read button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 md:group-hover:opacity-100 pointer-events-none">
          <div className="bg-white/15 backdrop-blur-sm rounded-full p-3.5">
            <BookOpen className="h-6 w-6 text-white translate-x-0.5" />
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col gap-0.5 px-0.5 mt-1">
        <Link 
          href={`/truyen/${slug}`} 
          className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-white/90 hover:text-white line-clamp-2 transition-colors leading-[1.4]" 
          title={title}
        >
          {title}
        </Link>
        {originalTitle && (
          <span className="text-[12px] sm:text-[13px] text-white/40 line-clamp-1">{originalTitle}</span>
        )}
      </div>
    </div>
  );
}
