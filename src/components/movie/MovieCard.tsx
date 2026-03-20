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
}

export function MovieCard({ title, slug, posterUrl, year, quality }: MovieCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 transition-all duration-300">
      <Link href={`/movie/${slug}`} className="relative aspect-[2/3] w-full overflow-hidden rounded-[var(--radius)] bg-surface shadow-lg group-hover:shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all duration-500 transform group-hover:-translate-y-2">
        <Image 
          src={posterUrl} 
          alt={title} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {quality && (
          <div className="absolute top-2 left-2 rounded-full bg-[#00a3ff] px-2.5 py-1 text-[10px] font-black tracking-wide text-white shadow-lg">
            {quality}
          </div>
        )}

        {year && (
          <div className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
            {year}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="bg-[#00a3ff]/20 backdrop-blur-md rounded-full p-4 transform transition-all duration-300 group-hover:scale-110 border border-white/20">
            <Play className="h-6 w-6 text-white fill-white translate-x-0.5" />
          </div>
        </div>
      </Link>
      
      <div className="flex flex-col gap-1 px-1">
        <Link href={`/movie/${slug}`} className="text-[15px] font-bold text-white/90 hover:text-primary line-clamp-1 transition-colors" title={title}>
          {title}
        </Link>
        {year && (
          <span className="text-[12px] font-medium text-white/30">{year}</span>
        )}
      </div>
    </div>
  );
}
