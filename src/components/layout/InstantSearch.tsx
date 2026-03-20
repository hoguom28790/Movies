"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, Play } from "lucide-react";
import { Movie } from "@/types/movie";

export function InstantSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await fetch(`/api/movies?type=search&keyword=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.items.slice(0, 10)); // Show top 10
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Instant search failed:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 max-w-md hidden md:block mx-auto" ref={dropdownRef}>
      <div className={`relative flex items-center bg-[#111]/80 border border-white/5 rounded-lg px-4 py-2 transition-all duration-300 ${
        isOpen ? "ring-1 ring-[#00a3ff]/30 bg-[#161616]" : "hover:bg-[#1a1a1a]"
      }`}>
        <Search className={`h-4 w-4 transition-colors ${loading ? "text-[#00a3ff] animate-pulse" : "text-white/20"}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 1 && setIsOpen(true)}
          placeholder="Tìm kiếm phim, diễn viên..."
          className="ml-3 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/10 outline-none font-medium tracking-tight"
        />
        {query && (
          <button onClick={() => setQuery("")} className="ml-2 text-white/20 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e0e0e] border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-3 border-b border-white/5">
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Danh sách phim</span>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                 <Loader2 className="h-6 w-6 text-[#00a3ff] animate-spin" />
                 <span className="text-xs text-white/20 font-medium">Đang tìm kiếm...</span>
              </div>
            ) : (
              results.map((movie) => (
                <Link
                  key={movie.slug}
                  href={`/movie/${movie.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-4 py-2 hover:bg-white/5 transition-colors group"
                >
                  <div className="relative h-16 w-11 flex-shrink-0 rounded-md overflow-hidden bg-white/5">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Play className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <h4 className="text-[13px] font-bold text-white group-hover:text-[#00a3ff] transition-colors truncate">
                      {movie.title}
                    </h4>
                    <p className="text-[11px] text-white/40 font-medium truncate italic opacity-80">
                      {movie.originalTitle || movie.title}
                    </p>
                    <span className="text-[10px] font-black text-white/20">{movie.year || "2024"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {!loading && results.length > 0 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 bg-[#161616] text-center text-[11px] font-black text-white/30 hover:text-[#00a3ff] hover:bg-[#1a1a1a] transition-all border-t border-white/5 uppercase tracking-widest"
            >
              Toàn bộ kết quả
            </Link>
          )}

          {!loading && results.length === 0 && query && (
             <div className="py-12 text-center">
                 <span className="text-xs text-white/20 font-medium">Không tìm thấy kết quả nào cho "{query}"</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
