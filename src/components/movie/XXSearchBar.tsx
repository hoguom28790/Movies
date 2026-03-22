"use client";

import React from "react";
import { Search, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

export function XXSearchBar() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    if (query?.trim()) {
      router.push(`/v2k9r5w8m3x7n1p4q0z6/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="px-6 -mt-8 relative z-20 container mx-auto lg:px-12 max-w-7xl">
      <form 
        onSubmit={handleSearch}
        className="w-full h-16 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center px-6 gap-4 shadow-2xl transition-all hover:bg-white/10 hover:border-yellow-500/30 group"
      >
        <Search className="w-5 h-5 text-white/30 group-focus-within:text-yellow-500 transition-colors" />
        <input 
          name="q"
          className="bg-transparent border-none focus:ring-0 text-white placeholder-white/20 w-full font-black text-[15px] uppercase italic tracking-tighter outline-none" 
          placeholder="Tìm kiếm tác phẩm hoặc diễn viên..." 
          type="text"
          autoComplete="off"
        />
        <button type="button" className="p-2 text-white/20 hover:text-yellow-500 transition-colors">
          <Mic className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
