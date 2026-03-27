"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
    { id: "episodes", label: "Tập phim", show: true },
    { id: "collection", label: "Bộ sưu tập", show: !!collection },
    { id: "recommendations", label: "Đề xuất", show: recommendations.length > 0 },
  ];

  return (
    <div className="flex flex-col">
      {/* Tab headers - Apple Style */}
      <div className="flex items-center gap-6 mb-8 overflow-x-auto no-scrollbar">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-2 text-sm font-bold whitespace-nowrap transition-all relative",
              activeTab === tab.id 
                ? "text-primary border-b-2 border-primary" 
                : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {/* EPISODES */}
        {activeTab === "episodes" && (
          <div className="animate-in fade-in duration-300">
            {servers.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {servers.map((server, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setActiveServer(sIdx)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                      activeServer === sIdx
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface text-foreground-secondary hover:bg-foreground/5"
                    )}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {(servers[activeServer]?.items || []).map((ep: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/xem/${slug}?sv=${activeServer}&ep=${encodeURIComponent(ep.slug || ep.name)}`}
                  scroll={false}
                  className="flex items-center justify-center px-3 py-2 rounded-lg bg-surface text-xs font-bold text-foreground-secondary hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <span className="truncate">{ep.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* COLLECTION */}
        {activeTab === "collection" && collection && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {collection.parts?.map((part: any) => (
                <Link key={part.id} href={`/search?q=${encodeURIComponent(part.title)}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-surface shadow-md group-hover:scale-105 transition-all">
                    <img
                      src={part.poster_path ? `https://image.tmdb.org/t/p/w342${part.poster_path}` : "https://placehold.co/600x900/F2F2F7/007AFF?text=No+Poster"}
                      alt={part.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{part.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
 
        {/* RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 12).map((m: any) => (
                <Link key={m.id} href={`/search?q=${encodeURIComponent(m.title || m.name)}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-surface shadow-md group-hover:scale-105 transition-all">
                    <img
                      src={m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "https://placehold.co/600x900/F2F2F7/007AFF?text=No+Poster"}
                      alt={m.title || m.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/40 flex items-center gap-1">
                      <Star size={10} className="text-yellow-400 fill-current" />
                      <span className="text-[10px] text-white font-bold">{m.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{m.title || m.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
