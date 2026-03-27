"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MovieCard } from "@/components/movie/MovieCard";
import type { Movie } from "@/types/movie";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieGridProps {
  movies?: Movie[]; // renamed from initialMovies to movies for compatibility
  initialMovies?: Movie[]; 
  title: string;
  fetchUrl: string;
  currentPage?: number;
  initialPage?: number;
  totalPages: number;
  isXX?: boolean;
}

export function MovieGrid({ 
  movies: propMovies, 
  initialMovies,
  title, 
  fetchUrl, 
  currentPage, 
  initialPage,
  totalPages,
  isXX = false
}: MovieGridProps) {
  const finalInitialMovies = propMovies || initialMovies || [];
  const finalInitialPage = currentPage || initialPage || 1;

  const [movies, setMovies] = useState<Movie[]>(finalInitialMovies);
  const [page, setPage] = useState(finalInitialPage);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const separator = fetchUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${fetchUrl}${separator}page=${nextPage}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMovies = data.items.filter((m: Movie) => !existingIds.has(m.id));
          return [...prev, ...newMovies];
        });
        setPage(nextPage);
      } else if (isXX) {
        setPage(totalPages);
      }
    } catch (err) {
      console.error("Failed to load more movies:", err);
      if (isXX) setPage(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, fetchUrl, isXX]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, loading, page, totalPages]);

  if (isXX) {
    return (
      <div className="py-12 md:py-20 animate-in fade-in duration-1000">
        <div className="flex flex-col gap-2 mb-12 px-2">
          <div className="h-1 w-12 bg-yellow-500 rounded-full animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase italic tracking-tighter leading-none">
            {title}
          </h1>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-foreground/[0.02] border border-foreground/5 rounded-[40px] border-dashed">
            <p className="text-foreground/20 text-sm font-black uppercase tracking-[0.4em] italic">No content found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-x-6 gap-y-12">
            {movies.map((movie, idx) => (
              <MovieCard 
                key={movie.id} 
                title={movie.title} 
                slug={movie.slug} 
                posterUrl={movie.posterUrl} 
                year={movie.year} 
                quality={movie.quality} 
                isXX={true}
                index={idx % 20}
              />
            ))}
          </div>
        )}

        {page < totalPages && (
          <div ref={observerTarget} className="w-full py-24 flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-500/50" />
                <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] animate-pulse">Loading more</span>
              </div>
            )}
          </div>
        )}
        
        {page >= totalPages && movies.length > 0 && (
           <div className="w-full py-24 flex items-center justify-center border-t border-white/5 mt-20">
            <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.5em] italic">End of the collection</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-12 py-8 mt-16">
      <h1 className="text-xl md:text-2xl font-semibold mb-8 text-white/90">{title}</h1>

      {movies.length === 0 ? (
        <p className="text-neutral-400 text-center py-20">Không tìm thấy phim nào.</p>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {movies.map((movie, idx) => (
            <MovieCard 
              key={movie.id} 
              title={movie.title} 
              slug={movie.slug} 
              posterUrl={movie.posterUrl} 
              year={movie.year} 
              quality={movie.quality} 
              index={idx % 20}
            />
          ))}
        </div>
      )}

      {/* Infinite Scroll Loading Trigger */}
      {page < totalPages && (
        <div ref={observerTarget} className="w-full py-12 flex items-center justify-center">
          {loading && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
        </div>
      )}
      
      {page >= totalPages && movies.length > 0 && (
         <div className="w-full py-12 flex items-center justify-center">
         <p className="text-neutral-500 text-sm font-medium">Bạn đã xem hết danh sách phim.</p>
       </div>
      )}
    </div>
  );
}
