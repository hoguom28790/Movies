import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface XXMovieCardProps {
  title: string;
  slug: string;
  posterUrl: string;
  year?: string;
  quality?: string;
}

export function XXMovieCard({ title, slug, posterUrl, year, quality }: XXMovieCardProps) {
  return (
    <div className="group relative flex flex-col gap-2 transition-all duration-300">
      <Link href={`/xx/movie/${slug}`} className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/40">
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {quality && (
          <div className="absolute top-2 right-2 rounded-md bg-yellow-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-black uppercase">
            {quality}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-full p-3.5 border border-yellow-500/30">
            <Play className="h-6 w-6 text-yellow-500 fill-yellow-500 translate-x-0.5" />
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col gap-0.5 px-0.5 mt-1">
        <Link 
          href={`/xx/movie/${slug}`} 
          className="text-[12px] sm:text-[13px] font-semibold text-white/90 hover:text-yellow-400 line-clamp-2 transition-colors leading-[1.3]" 
          title={title}
        >
          {title}
        </Link>
        {year && (
          <span className="text-[12px] sm:text-[11px] text-white/30">{year}</span>
        )}
      </div>
    </div>
  );
}
