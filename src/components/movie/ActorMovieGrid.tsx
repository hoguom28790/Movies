"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Star, ArrowUpDown } from "lucide-react";
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

type SortField = 'popularity' | 'year' | 'title';
type SortOrder = 'asc' | 'desc';

export function ActorMovieGrid({ allMovies, actorName }: { allMovies: MovieNode[]; actorName: string }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [sortField, setSortField] = useState<SortField>('popularity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset infinite scroll when sort changes
  useEffect(() => {
    setVisibleCount(30);
  }, [sortField, sortOrder]);

  const sortedMovies = useMemo(() => {
    return [...allMovies].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'popularity') {
        comparison = (a.vote_count || 0) - (b.vote_count || 0);
      } else if (sortField === 'year') {
        const yearA = parseInt((a.release_date || a.first_air_date || '0').split('-')[0]) || 0;
        const yearB = parseInt((b.release_date || b.first_air_date || '0').split('-')[0]) || 0;
        comparison = yearA - yearB;
      } else if (sortField === 'title') {
        const titleA = a.title || a.name || '';
        const titleB = b.title || b.name || '';
        comparison = titleA.localeCompare(titleB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allMovies, sortField, sortOrder]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && visibleCount < sortedMovies.length) {
        setVisibleCount(prev => Math.min(prev + 30, sortedMovies.length));
      }
    }, { rootMargin: "400px 0px" });

    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [visibleCount, sortedMovies.length]);

  const displayedMovies = sortedMovies.slice(0, visibleCount);

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
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-foreground/5 p-1 rounded-xl">
              <select 
                className="bg-transparent border-none outline-none text-sm font-bold text-foreground px-3 py-1.5 cursor-pointer appearance-none transition-all hover:text-primary"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                <option className="text-black dark:text-white" value="popularity">🔥 Độ phổ biến</option>
                <option className="text-black dark:text-white" value="year">📅 Năm phát hành</option>
                <option className="text-black dark:text-white" value="title">A-Z Tên phim</option>
              </select>

              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="bg-background/50 hover:bg-background/80 shadow-sm px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 active:scale-95"
                title="Đổi chiều sắp xếp"
              >
                <ArrowUpDown size={16} className="text-primary" />
                {sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}
              </button>
           </div>
           
           <div className="hidden lg:flex items-center gap-3 text-foreground/20 font-bold uppercase tracking-[0.3em] text-[10px] ml-4 pl-4 border-l border-foreground/10">
             <span>Tìm thấy</span>
             <span className="text-foreground/40 text-[18px] font-black">{sortedMovies.length}</span>
           </div>
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
                src={getTMDBImageUrl(m.poster_path || null, 'w342') || "https://dummyimage.com/500x750/111/fff&text=No+Poster"}
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
