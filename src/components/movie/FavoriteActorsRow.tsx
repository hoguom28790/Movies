"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, User2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFavoriteActors } from "@/services/db";
import { TOPXX_PATH } from "@/lib/constants";
import { ActorModal } from "./ActorModal";

interface FavoriteActorsRowProps {
  isXX?: boolean;
}

export function FavoriteActorsRow({ isXX = false }: FavoriteActorsRowProps) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;
  const rowRef = useRef<HTMLDivElement>(null);
  const [selectedActor, setSelectedActor] = React.useState<any>(null);

  const { data: actors = [], isLoading: actorsLoading } = useQuery({
    queryKey: ['favorite-actors', userId, isXX ? 'topxx' : 'movie'],
    queryFn: () => userId ? getUserFavoriteActors(userId, isXX ? 'topxx' : 'movie') : Promise.resolve([]),
    enabled: !!userId,
  });

  const isLoading = authLoading || actorsLoading;

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollTo = dir === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
  };

  if (!userId || (!isLoading && actors.length === 0)) return null;

  return (
    <section className="relative w-full animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-12 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-8 ${isXX ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-primary'} rounded-full`} />
          <h3 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
            DIỄN VIÊN YÊU THÍCH
          </h3>
        </div>
        <div className="flex items-center gap-6">
          <Link 
            href={`/${TOPXX_PATH}/yeu-thich?tab=actors`}
            className="text-sm font-black text-yellow-500 hover:opacity-80 transition-all flex items-center gap-2 uppercase tracking-widest italic"
          >
            Xem tất cả <ChevronRight size={14} />
          </Link>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-6">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full glass-pro text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center border border-foreground/5"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full glass-pro text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center border border-foreground/5"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative group">
        <div
          ref={rowRef}
          className="flex overflow-x-auto pb-8 scroll-smooth px-6 lg:px-12 no-scrollbar gap-8 md:gap-12"
        >
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-foreground/5" />
                <div className="w-20 h-3 bg-foreground/5 rounded-full" />
              </div>
            ))
          ) : (
            actors.map((actor: any) => (
              <button 
                key={actor.id}
                onClick={() => setSelectedActor(actor)}
                className="flex-shrink-0 flex flex-col items-center gap-4 group/actor focus:outline-none transition-transform hover:scale-105 active:scale-95"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-foreground/5 p-1 group-hover/actor:border-yellow-500/30 transition-all shadow-xl bg-surface">
                   <img 
                      src={
                        (actor.profilePath || actor.profile_path || actor.profileImageUrl || actor.profileImage || actor.avatar || actor.thumbnail)?.startsWith('http') 
                          ? (actor.profilePath || actor.profile_path || actor.profileImageUrl || actor.profileImage || actor.avatar || actor.thumbnail)
                          : (actor.profilePath || actor.profile_path 
                              ? `https://image.tmdb.org/t/p/w500${actor.profilePath || actor.profile_path}` 
                              : `https://javmodel.com/javdata/uploads/${String(actor.id).replace(/-/g, '_')}150.jpg`)
                      } 
                      alt={actor.name}
                      className="w-full h-full object-cover rounded-full group-hover/actor:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => { 
                        const target = e.currentTarget;
                        const parts = String(actor.id).split('-');
                        if (parts.length === 2 && !target.src.includes(`${parts[1]}_${parts[0]}`)) {
                          target.src = `https://javmodel.com/javdata/uploads/${parts[1]}_${parts[0]}150.jpg`;
                          return;
                        }
                        if (!target.src.includes('placehold.co')) {
                          target.src = `https://placehold.co/500x500/0f1115/efb11d?text=${encodeURIComponent(actor.name)}`;
                        }
                      }}
                    />
                </div>
                <span className="text-[11px] md:text-sm font-black uppercase italic tracking-tight text-foreground/60 group-hover/actor:text-yellow-500 transition-colors text-center w-24 md:w-32 line-clamp-1">
                  {actor.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedActor && (
        <ActorModal 
          isOpen={true}
          actor={selectedActor}
          onClose={() => setSelectedActor(null)}
          isXX={isXX}
        />
      )}
    </section>
  );
}
