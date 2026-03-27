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
          className="w-full h-20 md:h-24 bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[32px] md:rounded-[48px] flex items-center px-8 md:px-12 gap-5 md:gap-8 shadow-cinematic-xl group hover:border-yellow-500/20 transition-all duration-700"
        >
          <Search className="w-6 h-6 md:w-10 md:h-10 text-yellow-500 animate-pulse" />
          <input 
            name="q"
            className="bg-transparent border-none text-xl md:text-3xl font-black text-white italic uppercase placeholder-white/10 w-full tracking-tighter focus:ring-0 outline-none" 
            placeholder="Tìm phim, mã phim hoặc diễn viên..." 
            type="text"
          />
        </form>
      </div>
    );
  }

  return (
    <div className="px-6 -mt-8 relative z-20 container mx-auto lg:px-12">
      <form 
        onSubmit={handleSearch}
        className="w-full h-16 bg-white/[0.05] backdrop-blur-3xl border border-white/10 rounded-full flex items-center px-6 gap-4 shadow-2xl transition-all hover:bg-white/[0.08]"
      >
        <Search className="w-5 h-5 text-neutral-400" />
        <input 
          id="home-search-q"
          name="q"
          className="bg-transparent border-none focus:ring-primary text-white placeholder-neutral-500 w-full font-medium text-[15px] outline-none" 
          placeholder="Tìm phim, truyện hoặc diễn viên..." 
          type="text"
        />
        <button type="button" className="p-2 text-neutral-400 hover:text-white transition-colors">
          <Mic className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
