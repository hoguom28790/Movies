"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, deleteFromHistory } from "@/services/db";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "./MovieCard";
import { History, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

export function MovieContinueWatching() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    getUserHistory(user.uid)
      .then(data => setItems(data.slice(0, 10)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleDelete = async (movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteFromHistory(user.uid, movieSlug);
      setItems(prev => prev.filter(item => item.movieSlug !== movieSlug));
    } catch (err) {
      console.error("Delete history failed:", err);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <section className="container mx-auto px-6 lg:px-12 py-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <History className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-foreground uppercase italic">
            Xem Tiếp
          </h3>
        </div>
        <Link href="/lich-su" className="text-primary text-[11px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-all">
          Lịch sử của bạn <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <Swiper
        modules={[FreeMode]}
        freeMode={true}
        spaceBetween={16}
        slidesPerView="auto"
        className="!overflow-visible"
      >
        {items.map((item) => {
          const progressPercent = item.durationSeconds && item.durationSeconds > 0 
            ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
            : 50;

          return (
            <SwiperSlide key={item.movieSlug} className="!w-[180px] sm:!w-[220px]">
              <div className="relative group">
                <MovieCard 
                  title={item.movieTitle}
                  slug={item.movieSlug}
                  posterUrl={item.posterUrl}
                  episodeText={`Tập ${item.episodeName}`}
                />
                
                {/* Progress bar */}
                <div className="absolute bottom-[-8px] left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden z-20">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 bubble-shadow" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                </div>

                {/* Delete button - Standardized */}
                <button 
                  onClick={(e) => handleDelete(item.movieSlug, e)}
                  className="delete-btn-premium"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
