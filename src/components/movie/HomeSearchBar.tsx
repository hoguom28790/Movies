"use client";

import React from "react";
import { Search, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

interface HomeSearchBarProps {
  isXX?: boolean;
}

export function HomeSearchBar({ isXX = false }: HomeSearchBarProps) {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    if (query?.trim()) {
      const path = isXX ? `/${TOPXX_PATH}/search?q=${encodeURIComponent(query)}` : `/search?q=${encodeURIComponent(query)}`;
      router.push(path);
    }
  };

  if (isXX) {
    return (
      <div className="px-4 lg:px-8 mb-20 -mt-10 relative z-20 max-w-7xl mx-auto w-full">
        <form 
          onSubmit={handleSearch}
          className="w-full h-20 md:h-24 bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[32px] md:rounded-[48px] flex items-center px-8 md:px-12 gap-5 md:gap-8 shadow-cinematic-xl group hover:border-yellow-500/20 transition-all duration-700 active-depth"
        >
          <Search className="w-6 h-6 md:w-10 md:h-10 text-yellow-500 animate-pulse" />
          <input 
            name="q"
            className="bg-transparent border-none text-xl md:text-3xl font-black text-foreground italic uppercase placeholder-foreground/20 w-full tracking-tighter focus:ring-0 outline-none" 
            placeholder="Tìm phim, mã phim hoặc diễn viên..." 
            type="text"
            autoComplete="off"
          />
        </form>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-12 -mt-10 relative z-20 container mx-auto">
      <form 
        onSubmit={handleSearch}
        className={cn(
          "w-full h-18 sm:h-20 apple-glass border-foreground/5 rounded-[28px] md:rounded-[36px] flex items-center px-8 gap-6 shadow-apple group transition-all duration-500 hover:shadow-apple-lg hover:border-foreground/10 ring-1 ring-white/5",
        )}
      >
        <Search className="w-6 h-6 text-foreground/20 group-hover:text-primary transition-colors duration-500" />
        <input 
          id="home-search-q"
          name="q"
          className="bg-transparent border-none focus:ring-0 text-foreground placeholder-foreground/20 w-full font-bold text-lg sm:text-xl outline-none tracking-tight" 
          placeholder="Tên phim hoặc nghệ sĩ..." 
          type="text"
          autoComplete="off"
        />
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-[10px] font-black text-foreground/20 uppercase tracking-widest italic animate-in fade-in slide-in-from-right-2">
           QUẢNG CÁO TẮT <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </form>
    </div>
  );
}
