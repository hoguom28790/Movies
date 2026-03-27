"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Movie } from "@/types/movie";
import { MovieCard } from "./MovieCard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

interface SearchResultsClientProps {
  initialQuery: string;
  initialPage: number;
  isXX?: boolean;
}

export function SearchResultsClient({ initialQuery, initialPage, isXX = false }: SearchResultsClientProps) {
  const [results, setResults] = useState<Movie[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      const query = initialQuery;
      if (!query) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchUrl = isXX 
          ? `/api/topxx/search?keyword=${encodeURIComponent(query)}&page=${initialPage}`
          : `/api/search?q=${encodeURIComponent(query)}&page=${initialPage}`;
          
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const items = data.items || [];
        setResults(items);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err: any) {
        console.error("Search fetch failed:", err);
        setError("Không thể tải kết quả. Vui lòng kiểm tra lại kết nối.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [initialQuery, initialPage, isXX]);

  const primaryColor = isXX ? "text-yellow-500" : "text-primary";
  const accentColor = isXX ? "text-yellow-500" : "text-primary";
  const hoverBg = isXX 
    ? "hover:bg-yellow-500 hover:text-black hover:border-yellow-500" 
    : "hover:bg-primary hover:text-white hover:border-primary";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <Loader2 className={cn("w-12 h-12 animate-spin", isXX ? "text-yellow-500" : "text-primary/40")} />
          <div className={cn("absolute inset-0 blur-2xl rounded-full animate-pulse", isXX ? "bg-yellow-500/20" : "bg-primary/10")} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className={cn(
            "text-[10px] tracking-[0.5em] animate-pulse",
            isXX ? "text-white/40 font-black uppercase italic" : "text-foreground/30 font-bold uppercase"
          )}>
            {isXX ? "Đang truy vấn Elite Archive..." : "Đang tìm kiếm..."}
          </p>
          {!isXX && <div className="h-0.5 w-16 rounded-full bg-primary/20" />}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-40 rounded-[48px] border space-y-6",
        isXX ? "bg-red-500/[0.02] border-red-500/5 text-red-500" : "bg-foreground/[0.02] border-foreground/5 text-foreground/40"
      )}>
        <Search className="w-10 h-10 opacity-20" />
        <p className={cn(
          "text-sm tracking-[0.4em] text-center px-12 leading-relaxed max-w-md",
          isXX ? "font-black uppercase italic" : "font-bold uppercase"
        )}>
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className={cn(
            "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active-depth",
            isXX ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-primary text-white hover:opacity-90"
          )}
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  if (!initialQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-20 animate-in fade-in duration-1000">
        <Search className={cn("w-16 h-16 mb-8", isXX ? "text-yellow-500" : "text-foreground/40")} />
        <p className={cn(
          "tracking-[0.5em] text-xs",
          isXX ? "font-black uppercase italic" : "font-bold uppercase"
        )}>
          Nhập từ khóa để khám phá
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-40 border rounded-[48px] border-dashed space-y-8 animate-in fade-in duration-700",
        isXX ? "bg-white/[0.02] border-white/5" : "bg-foreground/[0.02] border-foreground/5"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          isXX ? "bg-yellow-500/10 ring-8 ring-yellow-500/5" : "bg-primary/5 ring-8 ring-primary/[0.02]"
        )}>
          <Search className={cn("w-8 h-8 opacity-20", isXX ? "text-yellow-500" : "text-primary")} />
        </div>
        <div className="text-center space-y-8">
          <p className={cn(
            "text-sm tracking-[0.2em] text-center px-8 max-w-md",
            isXX ? "text-white/40 font-black uppercase italic" : "text-foreground/40 font-medium"
          )}>
            Không tìm thấy tác phẩm nào cho <br />
            <span className={cn(isXX ? "text-lg text-yellow-500" : "text-xl font-bold text-foreground")}>"{initialQuery}"</span>
          </p>
          <Link 
            href={isXX ? `/${TOPXX_PATH}` : "/"} 
            className={cn(
              "inline-block px-10 py-4 font-black uppercase tracking-widest text-[11px] rounded-full transition-all shadow-2xl active-depth",
              isXX 
                ? "bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/20 italic" 
                : "bg-primary text-white hover:opacity-90"
            )}
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const searchPath = isXX ? `/${TOPXX_PATH}/search` : "/search";

  return (
    <div className="flex flex-col gap-12 sm:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "flex flex-col gap-3 py-2",
        isXX ? "border-l-4 border-yellow-500 pl-8 bg-gradient-to-r from-yellow-500/5 to-transparent" : "px-2"
      )}>
        <h2 className={cn(
          "text-2xl sm:text-3xl md:text-5xl tracking-tighter",
          isXX ? "font-black text-white uppercase italic drop-shadow-2xl" : "font-bold text-foreground/90"
        )}>
          {isXX ? "KẾT QUẢ: " : "Kết quả cho: "}
          <span className={cn(
            isXX ? "text-yellow-500 underline underline-offset-[12px] decoration-yellow-500/30" : "text-primary"
          )}>
            "{initialQuery}"
          </span>
        </h2>
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-[10px] tracking-[0.4em]",
            isXX ? "font-black text-white/40 uppercase italic" : "font-bold text-foreground/20 uppercase"
          )}>
            ĐÃ TÌM THẤY {totalItems} KẾT QUẢ
          </span>
          <div className="flex-1 h-px bg-foreground/5" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
        {results.map((item, idx) => (
          <MovieCard 
            key={`${item.id}-${idx}`} 
            title={item.title}
            slug={item.slug}
            posterUrl={item.posterUrl}
            year={item.year}
            quality={item.quality}
            isXX={isXX}
            index={idx % 12}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={cn(
          "flex items-center justify-center gap-4 sm:gap-8 mt-12 py-12 border-t",
          isXX ? "border-white/5" : "border-foreground/5"
        )}>
          {initialPage > 1 && (
            <Link
              href={`${searchPath}?q=${encodeURIComponent(initialQuery)}&page=${initialPage - 1}`}
              className={cn(
                "h-12 px-6 sm:px-8 rounded-2xl flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl active-depth",
                isXX 
                  ? "bg-white/5 border border-white/10 text-white/40 italic hover:bg-yellow-500 hover:text-black hover:border-yellow-500" 
                  : "bg-foreground/5 border border-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10"
              )}
            >
              ← {isXX ? "TRƯỚC" : "Trang trước"}
            </Link>
          )}

          <div className={cn(
            "h-12 min-w-[120px] px-6 rounded-2xl flex flex-col items-center justify-center shadow-2xl",
            isXX ? "bg-yellow-500 text-black font-black italic" : "bg-primary text-white font-bold"
          )}>
            <span className={cn("text-[9px] uppercase tracking-widest -mb-1", isXX ? "opacity-40" : "opacity-60")}>Trang</span>
            <span className="text-[15px]">{initialPage} / {totalPages}</span>
          </div>

          {initialPage < totalPages && (
            <Link
              href={`${searchPath}?q=${encodeURIComponent(initialQuery)}&page=${initialPage + 1}`}
              className={cn(
                "h-12 px-6 sm:px-8 rounded-2xl flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl active-depth",
                isXX 
                  ? "bg-white/5 border border-white/10 text-white/40 italic hover:bg-yellow-500 hover:text-black hover:border-yellow-500" 
                  : "bg-foreground/5 border border-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10"
              )}
            >
              {isXX ? "TIẾP" : "Tiếp theo"} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
