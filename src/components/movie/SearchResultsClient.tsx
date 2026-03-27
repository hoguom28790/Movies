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
  const primaryBg = isXX ? "bg-yellow-500" : "bg-primary";
  const primaryBorder = isXX ? "border-yellow-500/20" : "border-primary/20";
  const accentColor = isXX ? "text-yellow-500" : "text-primary";
  const hoverBg = isXX ? "hover:bg-yellow-500 hover:text-black hover:border-yellow-500" : "hover:bg-primary hover:text-white hover:border-primary";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <Loader2 className={cn("w-16 h-16 animate-spin", isXX ? "text-yellow-500" : "text-primary")} />
          <div className={cn("absolute inset-0 blur-2xl rounded-full animate-pulse", isXX ? "bg-yellow-500/20" : "bg-primary/20")} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.6em] italic animate-pulse">
            {isXX ? "Đang truy vấn Elite Archive..." : "Đang tìm kiếm phim..."}
          </p>
          <div className={cn("h-0.5 w-24 rounded-full", isXX ? "bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" : "bg-gradient-to-r from-transparent via-primary/50 to-transparent")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-red-500/[0.02] border border-red-500/5 rounded-[48px] space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
           <Search className="w-10 h-10 text-red-500/20" />
        </div>
        <p className="text-red-500/50 text-sm font-black uppercase tracking-[0.4em] italic text-center px-12 leading-relaxed">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-2xl"
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  if (!initialQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-40 opacity-20 animate-in fade-in duration-1000">
        <Search className={cn("w-20 h-20 mb-8", isXX ? "text-yellow-500" : "text-primary")} />
        <p className="font-black uppercase tracking-[0.5em] text-xs italic">Nhập từ khóa để bắt đầu khám phá</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white/[0.02] border border-white/5 rounded-[48px] border-dashed space-y-8 animate-in fade-in duration-700">
        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center ring-8", isXX ? "bg-yellow-500/10 ring-yellow-500/5" : "bg-primary/10 ring-primary/5")}>
          <Search className={cn("w-10 h-10", isXX ? "text-yellow-500/20" : "text-primary/20")} />
        </div>
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-white/40 text-sm font-black uppercase tracking-[0.4em] italic text-center px-12">
              Không tìm thấy tác phẩm nào cho <br />
              <span className={cn("text-lg", accentColor)}>"{initialQuery}"</span>
            </p>
          </div>
          <Link 
            href={isXX ? `/${TOPXX_PATH}` : "/"} 
            className={cn(
              "inline-block px-10 py-4 font-black uppercase italic tracking-widest text-[11px] rounded-full border transition-all shadow-2xl",
              isXX ? "bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500 hover:text-black border-yellow-500/20" : "bg-primary/5 text-primary hover:bg-primary hover:text-white border-primary/20"
            )}
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const searchPath = isXX ? "/${TOPXX_PATH}/search" : "/search";

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={cn("flex flex-col gap-3 border-l-4 pl-8 py-2 rounded-r-3xl", isXX ? "border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-transparent" : "border-primary bg-gradient-to-r from-primary/5 to-transparent")}>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">
          KẾT QUẢ: <span className={cn("underline underline-offset-[12px]", isXX ? "text-yellow-500 decoration-yellow-500/30" : "text-primary decoration-primary/30")}>"{initialQuery}"</span>
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.6em] italic">
            ĐÃ TÌM THẤY {totalItems} KẾT QUẢ
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
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
        <div className="flex items-center justify-center gap-6 mt-12 py-10 border-t border-white/5">
          {initialPage > 1 && (
            <Link
              href={`${searchPath}?q=${encodeURIComponent(initialQuery)}&page=${initialPage - 1}`}
              className={cn(
                "h-14 px-8 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/40 uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl shadow-black/50",
                hoverBg
              )}
            >
              ← TRƯỚC
            </Link>
          )}
          <div className={cn("h-14 min-w-[140px] px-8 rounded-[24px] flex flex-col items-center justify-center shadow-2xl", primaryBg)}>
            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest -mb-1">Page</span>
            <span className="text-[16px] font-black text-black uppercase italic">{initialPage} / {totalPages}</span>
          </div>
          {initialPage < totalPages && (
            <Link
              href={`${searchPath}?q=${encodeURIComponent(initialQuery)}&page=${initialPage + 1}`}
              className={cn(
                "h-14 px-8 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/40 uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl shadow-black/50",
                hoverBg
              )}
            >
              TIẾP →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
