"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";

export function XXSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/xx/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs ml-4">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm phim..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:bg-white/10 transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        
        {query && (
          <button 
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        )}
      </div>

      {isOpen && (query || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#141416] border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
              <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Đang tìm kiếm...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
              {results.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/xx/movie/${movie.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="relative w-12 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <img
                      src={movie.thumbUrl || movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-white/90 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                      {movie.title}
                    </span>
                    <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-tighter">
                      {movie.quality}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center">
              <p className="text-sm text-white/30">Không tìm thấy kết quả phù hợp</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
