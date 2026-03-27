"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, Play, BookOpen } from "lucide-react";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

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
              const parsedComics = (data?.data?.items || []).slice(0, 5).map((c: any) => ({
                title: c.name,
                slug: c.slug,
                posterUrl: `${domain_cdn}/uploads/comics/${c.thumb_url}`,
                originalTitle: c.origin_name?.[0] || "",
                year: "Truyện"
              }));
              setResults(parsedComics);
              setIsOpen(true);
            }
          } else {
            const res = await fetch(`/api/movies?type=search&keyword=${encodeURIComponent(query)}`);
            if (res.ok) {
              const data = await res.json();
              setResults(data.items.slice(0, 5)); 
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
  }, [query, isComicSection]);

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
      window.location.href = url;
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      <form 
        onSubmit={handleSearchSubmit}
        className={cn(
          "relative flex items-center h-10 px-4 transition-all duration-300 rounded-full",
          "bg-foreground/5 dark:bg-foreground/10",
          isOpen ? "bg-surface shadow-lg ring-1 ring-primary/20" : "hover:bg-foreground/10"
        )}
      >
        <Search size={16} className="text-foreground-secondary flex-shrink-0" />
        <input
          id="instant-search-input"
          name="keyword"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 1 && setIsOpen(true)}
          placeholder={isComicSection ? "Tìm truyện..." : "Tìm phim..."}
          className="ml-2 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-secondary outline-none font-medium"
        />
        {loading && <Loader2 size={16} className="text-primary animate-spin" />}
        {query && !loading && (
          <button type="button" onClick={() => setQuery("")} className="ml-1 p-1 hover:text-foreground transition-colors">
            <X size={14} className="text-foreground-secondary" />
          </button>
        )}
      </form>

      {/* Dropdown Results - Apple Style */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-2xl border border-separator rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="py-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                 <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : (
              results.map((item) => (
                <Link
                  key={item.slug}
                  href={isComicSection ? `/truyen/${item.slug}` : `/xem/${item.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 transition-colors group"
                >
                  <div className="relative h-12 w-8 flex-shrink-0 rounded-lg overflow-hidden bg-foreground/5">
                    <Image
                      src={item.posterUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
                    <p className="text-[11px] text-foreground-secondary font-medium truncate italic">
                      {item.originalTitle || item.title}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {!loading && results.length > 0 && (
            <Link
              href={isComicSection ? `/truyen/search?q=${encodeURIComponent(query)}` : `/search?q=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="block w-full py-3 text-center text-xs font-bold text-primary hover:bg-foreground/5 transition-all border-t border-separator"
            >
              Xem tất cả
            </Link>
          )}

          {!loading && results.length === 0 && query && (
             <div className="py-6 text-center">
                 <span className="text-xs text-foreground-secondary font-medium">Không tìm thấy "{query}"</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
