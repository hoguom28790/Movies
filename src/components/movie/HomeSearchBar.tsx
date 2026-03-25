"use client";

import React from "react";
import { Search, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomeSearchBar() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    if (query?.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

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
          className="bg-transparent border-none focus:ring-primary text-white placeholder-neutral-500 w-full font-medium text-[15px]" 
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
