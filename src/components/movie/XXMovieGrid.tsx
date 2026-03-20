"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { XXMovieCard } from "@/components/movie/XXMovieCard";
import type { Movie } from "@/types/movie";
import { Loader2 } from "lucide-react";

interface XXMovieGridProps {
  initialMovies: Movie[];
  title: string;
  fetchUrl: string;
  initialPage: number;
  totalPages: number;
}

export function XXMovieGrid({ initialMovies, title, fetchUrl, initialPage, totalPages }: XXMovieGridProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}page=${nextPage}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMovies = data.items.filter((m: Movie) => !existingIds.has(m.id));
          return [...prev, ...newMovies];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more movies:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, fetchUrl]);

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

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-2 mb-12 px-2">
        <div className="h-1 w-12 bg-yellow-500 rounded-full animate-pulse" />
        <h1 className="text-3xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
          {title}
        </h1>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
          <p className="text-white/20 text-sm font-black uppercase tracking-[0.4em] italic">No content found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-12">
          {movies.map((movie) => (
            <XXMovieCard key={movie.id} title={movie.title} slug={movie.slug} posterUrl={movie.posterUrl} year={movie.year} quality={movie.quality} />
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
