"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, X } from "lucide-react";

const GENRES = [
  { name: "Hành Động", slug: "action" },
  { name: "Chuyển Sinh", slug: "chuyen-sinh" },
  { name: "Cổ Đại", slug: "co-dai" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Harem", slug: "harem" },
  { name: "Horror", slug: "horror" },
  { name: "Isekai", slug: "isekai" },
  { name: "Manga", slug: "manga" },
  { name: "Manhua", slug: "manhua" },
  { name: "Manhwa", slug: "manhwa" },
  { name: "Mystery", slug: "mystery" },
  { name: "Romance", slug: "romance" },
  { name: "School Life", slug: "school-life" },
  { name: "Sci-Fi", slug: "sci-fi" },
  { name: "Slice of life", slug: "slice-of-life" },
  { name: "Sports", slug: "sports" },
  { name: "Supernatural", slug: "supernatural" },
  { name: "Trọng Sinh", slug: "trong-sinh" },
];

const STATUSES = [
  { name: "Tất cả", slug: "all" },
  { name: "Đang ra", slug: "dang-phat-hanh" },
  { name: "Hoàn thành", slug: "hoan-thanh" },
];

export function ComicFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentGenre = searchParams.get("genre") || "";
  const currentStatus = searchParams.get("status") || "all";

  const [selectedGenre, setSelectedGenre] = useState(currentGenre);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedGenre(searchParams.get("genre") || "");
    setSelectedStatus(searchParams.get("status") || "all");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedGenre) params.set("genre", selectedGenre);
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);
    
    // Save to localStorage
    localStorage.setItem("comic_filter_genre", selectedGenre);
    localStorage.setItem("comic_filter_status", selectedStatus);

    router.push(`/truyen?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedStatus("all");
    localStorage.removeItem("comic_filter_genre");
    localStorage.removeItem("comic_filter_status");
    router.push(`/truyen`);
    setIsOpen(false);
  };

  const activeFiltersCount = (currentGenre ? 1 : 0) + (currentStatus !== "all" ? 1 : 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shadow-lg ${activeFiltersCount > 0 ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-foreground/10 hover:bg-foreground/20 text-foreground"}`}
      >
        <Filter className="w-3.5 h-3.5" />
        Bộ Lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[320px] bg-surface/95 backdrop-blur-xl border border-foreground/[0.08] shadow-2xl shadow-black/20 rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground/50">Lọc Truyện Tranh</h3>
             {activeFiltersCount > 0 && (
               <button onClick={clearFilters} className="text-[11px] text-red-400 hover:text-red-300 font-bold transition-colors">
                 Xóa Lọc
               </button>
             )}
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <span className="text-[11px] font-bold text-foreground/40 mb-2 block uppercase">Trạng Thái</span>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s.slug}
                    onClick={() => setSelectedStatus(s.slug)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${selectedStatus === s.slug ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <span className="text-[11px] font-bold text-foreground/40 mb-2 block uppercase">Thể Loại</span>
              <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto scrollbar-hide pr-2">
                {GENRES.map(g => (
                  <button
                    key={g.slug}
                    onClick={() => setSelectedGenre(selectedGenre === g.slug ? "" : g.slug)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${selectedGenre === g.slug ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-foreground/[0.06] flex gap-2">
              <button 
                onClick={applyFilters}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-[12px] font-bold transition-all shadow-lg shadow-primary/20"
              >
                Áp Dụng Lọc
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-lg text-[12px] font-bold transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
