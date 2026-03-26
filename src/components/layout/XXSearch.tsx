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

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/topxx/search?q=${encodeURIComponent(debouncedQuery)}`);
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
        if (!query) setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  return (
    <div ref={containerRef} className={`relative transition-all duration-300 ${isExpanded ? "flex-1 md:max-w-xs" : "w-10"} ml-auto md:ml-4`}>
      <div className="relative group flex items-center">
        {!isExpanded ? (
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-2 text-white/50 hover:text-yellow-500 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <>
            <input
              autoFocus
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
            
            <button 
              onClick={() => { 
                if (query) {
                  setQuery(""); setResults([]); 
                } else {
                  setIsExpanded(false);
                  setIsOpen(false);
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </>
        )}
      </div>

      {isOpen && (query || isLoading) && isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
              <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Đang tìm kiếm...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
              {results.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/xem/${movie.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    setIsExpanded(false);
                  }}
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
            <div className="p-8 text-center text-white/30 text-sm">
               Không tìm thấy kết quả
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
