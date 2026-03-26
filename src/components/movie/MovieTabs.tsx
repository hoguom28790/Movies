"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, User, Users, Star, Info } from "lucide-react";

interface MovieTabsProps {
  slug: string;
  source: string;
  servers: { name: string; items: any[] }[];
  recommendations: any[];
  collection?: any;
}

export function MovieTabs({
  slug,
  source,
  servers,
  recommendations,
  collection
}: MovieTabsProps) {
  const [activeTab, setActiveTab] = useState<"episodes" | "collection" | "recommendations">("episodes");
  const [activeServer, setActiveServer] = useState(0);

  const tabs = [
    { id: "episodes", label: "TẬP PHIM", show: true },
    { id: "collection", label: "BỘ SƯU TẬP", show: !!collection },
    { id: "recommendations", label: "ĐỀ XUẤT", show: recommendations.length > 0 },
  ];

  return (
    <div className="flex flex-col">
      {/* Tab headers */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-white/[0.06] mb-6 overflow-x-auto no-scrollbar">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-all relative ${
              activeTab === tab.id 
                ? "text-primary" 
                : "text-foreground/30 hover:text-foreground/60"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* ── EPISODES ── */}
        {activeTab === "episodes" && (
          <div className="animate-in fade-in duration-300">

            {/* Server selector */}
            {servers.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {servers.map((server, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setActiveServer(sIdx)}
                    className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                      activeServer === sIdx
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            )}

            {/* Episode grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
              {(servers[activeServer]?.items || []).map((ep: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/xem/${slug}?sv=${activeServer}&ep=${encodeURIComponent(ep.slug || ep.name)}`}
                  scroll={false}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-foreground/[0.03] border border-foreground/[0.06] text-[12px] text-foreground/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Play className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ep.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── COLLECTION ── */}
        {activeTab === "collection" && collection && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 px-1">
              <h3 className="text-base font-bold text-foreground">{collection.name}</h3>
              <p className="text-[13px] text-foreground/40 mt-1">{collection.parts?.length} phim trong bộ sưu tập này</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {collection.parts?.map((part: any) => (
                <Link key={part.id} href={`/search?q=${encodeURIComponent(part.title)}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-foreground/5 group-hover:-translate-y-1 transition-transform">
                    <img
                      src={part.poster_path ? `https://image.tmdb.org/t/p/w342${part.poster_path}` : "https://placehold.co/600x900/111111/4ade80?text=No+Poster"}
                      alt={part.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Info className="w-8 h-8" />
                    </div>
                  </div>
                  <p className="text-[12px] font-medium text-foreground/70 group-hover:text-primary line-clamp-1 truncate">{part.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
 
        {/* ── RECOMMENDATIONS ── */}
        {activeTab === "recommendations" && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recommendations.map((m: any) => (
                <Link key={m.id} href={`/search?q=${encodeURIComponent(m.title || m.name)}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-foreground/5 group-hover:-translate-y-1 transition-transform">
                    <img
                      src={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "https://placehold.co/600x900/111111/4ade80?text=No+Poster"}
                      alt={m.title || m.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                      <span className="text-[10px] text-white font-medium">{m.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground/80 group-hover:text-primary line-clamp-1">{m.title || m.name}</p>
                    <p className="text-[11px] text-foreground/30">{m.release_date?.split("-")[0] || m.first_air_date?.split("-")[0]}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
