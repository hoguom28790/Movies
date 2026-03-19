"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MovieCard } from "@/components/movie/MovieCard";
import type { Movie } from "@/types/movie";
import { Loader2 } from "lucide-react";

interface MovieGridProps {
  movies: Movie[];
  title: string;
  fetchUrl: string;
  currentPage: number;
  totalPages: number;
}

export function MovieGrid({ movies: initialMovies, title, fetchUrl, currentPage: initialPage, totalPages }: MovieGridProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${fetchUrl}&page=${nextPage}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        setMovies(prev => {
          // Prevent duplicates just in case
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
    <div className="container mx-auto px-4 py-8 mt-20">
      <h1 className="text-3xl font-black mb-8 border-l-4 border-primary pl-4">{title}</h1>

      {movies.length === 0 ? (
        <p className="text-neutral-400 text-center py-20">Không tìm thấy phim nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} title={movie.title} slug={movie.slug} posterUrl={movie.posterUrl} year={movie.year} quality={movie.quality} />
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
