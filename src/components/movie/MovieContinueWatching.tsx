"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, deleteFromHistory } from "@/services/db";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "./MovieCard";
import { History, ChevronRight } from "lucide-react";
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
    <section className="container mx-auto px-6 lg:px-20 py-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <History className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl md:text-5xl font-black font-headline tracking-tighter text-white uppercase italic leading-none drop-shadow-xl">
              XEM TIẾP
            </h3>
            <p className="text-[11px] md:text-[12px] text-white/20 font-black uppercase tracking-[0.4em] italic group-hover:text-primary transition-colors">
              RESUME ARCHIVE PROTOCOL • 2026
            </p>
          </div>
        </div>
        
        <Link 
          href="/lich-su" 
          className="group flex items-center gap-4 px-8 py-4 rounded-[24px] glass-pro bg-black/40 text-[11px] font-black uppercase tracking-[0.2em] italic text-primary border border-primary/20 hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all duration-700 active-depth"
        >
          ALL HISTORY 
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </Link>
      </div>

      <div className="relative group/swiper">
        <Swiper
          modules={[FreeMode]}
          freeMode={true}
          spaceBetween={28}
          slidesPerView="auto"
          className="!overflow-visible"
        >
          {items.map((item, idx) => {
            const progressPercent = item.durationSeconds && item.durationSeconds > 0 
              ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
              : 50;

            return (
              <SwiperSlide key={item.movieSlug} className="!w-[200px] sm:!w-[280px]">
                <div className="group/item relative">
                   {(() => {
                      const formatTime = (s: number) => {
                        const h = Math.floor(s / 3600);
                        const m = Math.floor((s % 3600) / 60);
                        return h > 0 ? `${h}h${m}m` : `${m}m`;
                      };
                      const progressText = item.progressSeconds > 0 ? `Xem đến ${formatTime(item.progressSeconds)} (${progressPercent}%)` : "Mới xem";
                      // Find best fallback source
                      const watchSource = (item as any).source || 'ophim';
                      const watchHref = `/xem/${watchSource}/${item.movieSlug}/${encodeURIComponent(item.episodeName || '1')}`;

                      return (
                        <MovieCard 
                          title={item.movieTitle}
                          slug={item.movieSlug}
                          posterUrl={item.posterUrl}
                          episodeText={`Tập ${item.episodeName}`}
                          progress={progressPercent}
                          progressText={progressText}
                          customHref={watchHref}
                          onDelete={(e) => handleDelete(item.movieSlug, e)}
                          index={idx}
                        />
                      );
                   })()}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
