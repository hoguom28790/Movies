"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, Play, BookOpen } from "lucide-react";
import { Movie } from "@/types/movie";

export function InstantSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isComicSection = pathname.startsWith("/truyen") || pathname.startsWith("/doc");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          if (isComicSection) {
            const res = await fetch(`https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}`);
            if (res.ok) {
              const data = await res.json();
              const domain_cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
              const parsedComics = (data?.data?.items || []).slice(0, 10).map((c: any) => ({
                title: c.name,
                slug: c.slug,
                posterUrl: `${domain_cdn}/uploads/comics/${c.thumb_url}`,
                originalTitle: c.origin_name?.[0] || `Ch. ${c.chaptersLatest?.[0]?.chapter_name || '??'}`,
                year: "Truyện"
              }));
              setResults(parsedComics);
              setIsOpen(true);
            }
          } else {
            const res = await fetch(`/api/movies?type=search&keyword=${encodeURIComponent(query)}`);
            if (res.ok) {
              const data = await res.json();
              setResults(data.items.slice(0, 10)); // Show top 10
              setIsOpen(true);
            }
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 1) {
      setIsOpen(false);
      const url = isComicSection ? `/truyen/search?q=${encodeURIComponent(query)}` : `/search?q=${encodeURIComponent(query)}`;
      window.location.href = url; // Hard nav or use router.push if we add useRouter
    }
  };

  return (
    <div className="relative flex-1 max-w-md hidden md:block mx-auto" ref={dropdownRef}>
      <form 
        onSubmit={handleSearchSubmit}
        className={`relative flex items-center bg-surface border border-foreground/5 rounded-lg px-4 py-2 transition-all duration-300 ${
          isOpen ? "ring-1 ring-primary/30 bg-surface shadow-lg" : "hover:bg-foreground/[0.03]"
        }`}
      >
        <button type="submit" className="outline-none" aria-label="Search">
           <Search className={`h-4 w-4 transition-colors ${loading ? "text-primary animate-pulse" : "text-foreground/20 hover:text-foreground"}`} />
        </button>
        <input
          id="instant-search-input"
          name="keyword"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 1 && setIsOpen(true)}
          placeholder={isComicSection ? "Tìm kiếm truyện tranh..." : "Tìm kiếm phim, diễn viên..."}
          className="ml-3 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/20 outline-none font-medium tracking-tight"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="ml-2 text-foreground/20 hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-foreground/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-3 border-b border-foreground/5">
             <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">{isComicSection ? "Danh sách truyện" : "Danh sách phim"}</span>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                 <Loader2 className="h-6 w-6 text-primary animate-spin" />
                 <span className="text-xs text-foreground/20 font-medium">Đang tìm kiếm...</span>
              </div>
            ) : (
              results.map((item) => (
                <Link
                  key={item.slug}
                  href={isComicSection ? `/truyen/${item.slug}` : `/phim/${item.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-4 py-2 hover:bg-foreground/5 transition-colors group"
                >
                  <div className="relative h-16 w-11 flex-shrink-0 rounded-md overflow-hidden bg-foreground/5">
                    <Image
                      src={item.posterUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       {isComicSection ? <BookOpen className="h-4 w-4 text-white fill-current" /> : <Play className="h-4 w-4 text-white fill-current" />}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <h4 className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-foreground/40 font-medium truncate italic opacity-80">
                      {item.originalTitle || item.title}
                    </p>
                    <span className="text-[10px] font-black text-foreground/10">{item.year || (isComicSection ? "Truyện" : "2024")}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {!loading && results.length > 0 && (
            <Link
              href={isComicSection ? `/truyen/search?q=${encodeURIComponent(query)}` : `/search?q=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 bg-foreground/[0.03] text-center text-[11px] font-black text-foreground/30 hover:text-primary hover:bg-foreground/[0.05] transition-all border-t border-foreground/5 uppercase tracking-widest"
            >
              Toàn bộ kết quả
            </Link>
          )}

          {!loading && results.length === 0 && query && (
             <div className="py-12 text-center">
                 <span className="text-xs text-foreground/20 font-medium">Không tìm thấy kết quả nào cho "{query}"</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
