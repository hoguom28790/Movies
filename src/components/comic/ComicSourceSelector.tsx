"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

interface ComicSourceSelectorProps {
  activeSource: string;
}

const SOURCES = [
  { id: "otruyen", name: "OTruyen", desc: "Server Việt Nam" },
  { id: "mangadex", name: "MangaDex", desc: "Global" },
  { id: "mangaplus", name: "MangaPlus", desc: "Official" },
];

export function ComicSourceSelector({ activeSource }: ComicSourceSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSwitch = (sourceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", sourceId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">Nguồn Truyện</h3>
      <div className="flex flex-wrap gap-3">
        {SOURCES.map((source) => {
          const isActive = activeSource.toLowerCase() === source.id;
          return (
            <button
              key={source.id}
              onClick={() => handleSwitch(source.id)}
              className={`group flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 border ${
                isActive
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-container-low border-outline-variant/10 text-on-surface-variant/60 hover:border-primary/50 hover:text-primary"
              }`}
            >
              <div className="flex flex-col items-start translate-y-[1px]">
                <span className={`font-headline font-black text-xs uppercase tracking-widest ${isActive ? 'text-white' : 'group-hover:text-primary'}`}>
                  {source.name}
                </span>
                <span className="text-[8px] uppercase tracking-tighter opacity-40 font-bold">
                  {source.desc}
                </span>
              </div>
              {isActive && <Check className="w-3.5 h-3.5 text-white animate-in fade-in zoom-in duration-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
