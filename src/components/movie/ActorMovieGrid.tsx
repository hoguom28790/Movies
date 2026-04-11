"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { getTMDBImageUrl } from "@/services/tmdb";

interface MovieNode {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_count?: number;
  character?: string;
  release_date?: string;
  first_air_date?: string;
}

export function ActorMovieGrid({ allMovies, actorName }: { allMovies: MovieNode[]; actorName: string }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && visibleCount < allMovies.length) {
        setVisibleCount(prev => Math.min(prev + 30, allMovies.length));
      }
    }, { rootMargin: "400px 0px" });

    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [visibleCount, allMovies.length]);

  const displayedMovies = allMovies.slice(0, visibleCount);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-foreground/5 pb-8">
        <div className="space-y-2">
           <h2 className="text-3xl font-bold text-foreground flex items-center gap-4">
             Tác phẩm tiêu biểu
             <span className="text-[10px] font-black bg-primary text-white px-3 py-1 rounded-full uppercase tracking-tighter ml-2">HOT</span>
           </h2>
           <p className="text-foreground/30 text-sm font-medium">Kho phim ấn tượng của {actorName.split(' ').pop()}</p>
        </div>
        <div className="flex items-center gap-4 text-foreground/20 font-bold uppercase tracking-[0.3em] text-[10px]">
           <span>Tổng số</span>
           <span className="text-foreground/40 text-[18px] font-black">{allMovies.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
        {displayedMovies.map((m, idx) => (
          <Link 
            key={`${m.id}-${idx}`} 
            href={`/search?q=${encodeURIComponent(m.title || m.name || "")}`} 
            className="group flex flex-col gap-5 active-depth"
          >
            <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-foreground/[0.03] shadow-apple border border-foreground/5 group-hover:shadow-primary/10 group-hover:border-primary/20 transition-all duration-500">
              <img
                src={getTMDBImageUrl(m.poster_path, 'w342') || "https://dummyimage.com/500x750/111/fff&text=No+Poster"}
                alt={m.title || m.name || "Movie"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                 <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 delay-100">
                    <Star className="w-5 h-5 text-white fill-current" />
                 </div>
              </div>
              
              <div className="absolute top-4 right-4 apple-glass px-3 py-1 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                 <span className="text-[10px] font-black text-white italic">{(m.release_date || m.first_air_date || "").split('-')[0]}</span>
              </div>
            </div>
            
            <div className="px-1 space-y-1.5">
              <p className="text-[15px] font-bold text-foreground/90 group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{m.title || m.name}</p>
              {m.character && (
                <p className="text-[10px] text-foreground/20 uppercase tracking-widest line-clamp-1 font-bold italic">vai {m.character}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {/* Intersection Observer target block */}
      {visibleCount < allMovies.length && (
         <div ref={loadMoreRef} className="w-full h-32 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
         </div>
      )}
    </>
  );
}
