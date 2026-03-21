"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDownUp } from "lucide-react";

interface Chapter {
  chapter_name: string;
  chapter_api_data: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  slug: string;
}

export function ChapterList({ chapters, slug }: ChapterListProps) {
  const [isDesc, setIsDesc] = useState(true); // Default to Descending (newest first)

  React.useEffect(() => {
    const saved = localStorage.getItem("truyen_sort_desc");
    if (saved !== null) {
      setIsDesc(saved === "true");
    }
  }, []);

  const toggleSort = () => {
    const newVal = !isDesc;
    setIsDesc(newVal);
    localStorage.setItem("truyen_sort_desc", String(newVal));
  };

  // Sort mathematically extracted numbers instead of just reversing array
  const displayChapters = [...chapters].sort((a, b) => {
    const numA = parseFloat(a.chapter_name.match(/[\d.]+/)?.[0] || "0");
    const numB = parseFloat(b.chapter_name.match(/[\d.]+/)?.[0] || "0");
    return isDesc ? numB - numA : numA - numB;
  });

  return (
    <div className="bg-[#0a0a0a]/50 rounded-2xl border border-white/[0.06] p-4 sm:p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white/90">Danh sách chương</h2>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSort}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors bg-white/5 py-1.5 px-3 rounded-lg border border-white/10"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            {isDesc ? "Mới nhất" : "Cũ nhất"}
          </button>
          <span className="text-sm font-medium text-white/40">{chapters.length} Chap</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {displayChapters.map((chap: any) => (
          <Link 
            key={chap.chapter_api_data}
            href={`/doc/${slug}/${chap.chapter_name}`}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.03] transition-colors"
          >
             <span className="text-white/80 font-medium text-[13px]">Chương {chap.chapter_name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
