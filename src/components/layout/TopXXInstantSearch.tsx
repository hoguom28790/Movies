"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, Play } from "lucide-react";
import { Movie } from "@/types/movie";
import { TOPXX_PATH } from "@/lib/constants";

export function TopXXInstantSearch() {
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
          const res = await fetch(`/api/topxx/search?keyword=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.items.slice(0, 10)); // Show top 10
            setIsOpen(true);
          }
        } catch (error) {
          console.error("TopXX Instant search failed:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500); // 500ms debounce for adult APIs which might be slower

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 1) {
      setIsOpen(false);
      const url = `/${TOPXX_PATH}/search?q=${encodeURIComponent(query)}`;
      window.location.href = url;
    }
  };

  return (
    <div className="relative flex items-center mx-1 sm:mx-4" ref={dropdownRef}>
      {/* Mobile Search Icon */}
      <Link 
        href={`/${TOPXX_PATH}/search`} 
        className="p-2 sm:hidden text-foreground/60 hover:text-primary transition-colors"
        title="Tìm kiếm"
      >
        <Search className="w-5 h-5" />
      </Link>

      {/* Desktop Search Bar */}
      <div className="hidden sm:block relative flex-1 max-w-[200px] lg:max-w-[360px]">
        <form 
          onSubmit={handleSearchSubmit}
          className={`relative flex items-center bg-foreground/[0.03] border border-foreground/[0.08] rounded-full px-4 py-1.5 transition-all duration-300 ${
            isOpen ? "ring-1 ring-yellow-500/30 bg-foreground/[0.06] shadow-lg shadow-yellow-500/5" : "hover:bg-foreground/[0.06]"
          }`}
        >
          <button type="submit" className="outline-none" aria-label="Search">
             <Search className={`h-4 w-4 transition-colors ${loading ? "text-yellow-500 animate-pulse" : "text-foreground/20 hover:text-foreground"}`} />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length > 1 && setIsOpen(true)}
            placeholder="Tìm phim, diễn viên..."
            className="ml-3 flex-1 bg-transparent text-[12px] text-foreground placeholder-foreground/20 outline-none font-medium italic tracking-tight uppercase"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="ml-2 text-foreground/20 hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Dropdown Results */}
        {isOpen && (results.length > 0 || loading) && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-surface border border-foreground/5 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-3xl">
            <div className="px-4 py-3 border-b border-foreground/5 bg-foreground/[0.02]">
               <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] italic">Danh sách tác phẩm</span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide py-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                   <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
                   <span className="text-[10px] text-foreground/20 font-black uppercase tracking-widest italic animate-pulse">Đang truy vấn...</span>
                </div>
              ) : (
                results.map((item) => (
                  <Link
                    key={item.slug || Math.random().toString()}
                    href={`/${TOPXX_PATH}/watch/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-2.5 hover:bg-foreground/[0.03] transition-colors group"
                  >
                    <div className="relative h-14 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-foreground/5">
                      <Image
                        src={item.posterUrl || "https://fakeimg.pl/200x300?text=No+Poster"}
                        alt={item.title || "No Title"}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Play className="h-4 w-4 text-black fill-current" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <h4 className="text-[12px] font-black text-foreground group-hover:text-yellow-500 transition-colors truncate uppercase italic tracking-tighter">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-foreground/40 font-black truncate italic opacity-80 uppercase tracking-tight">
                        {item.originalTitle || item.title || ""}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[9px] font-black text-yellow-500/40 uppercase tracking-tighter">{item.year || "2024"}</span>
                         <span className="text-[8px] px-1 py-0.5 rounded-sm bg-foreground/5 text-foreground/20 font-black uppercase tracking-widest">{item.quality || "4K"}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {!loading && results.length > 0 && (
              <Link
                href={`/${TOPXX_PATH}/search?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="block w-full py-4 bg-yellow-500/5 text-center text-[10px] font-black text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all border-t border-foreground/5 uppercase tracking-[0.3em] italic"
              >
                Xem tất cả kết quả →
              </Link>
            )}

            {!loading && results.length === 0 && query && (
               <div className="py-12 text-center bg-foreground/[0.01]">
                   <span className="text-[10px] text-foreground/20 font-black uppercase tracking-widest italic">Không tìm thấy bản ghi nào cho "{query}"</span>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
