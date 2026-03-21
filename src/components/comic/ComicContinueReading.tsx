"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserComicHistory, removeComicHistoryItem, ComicHistoryEntry } from "@/services/comicDb";
import { ComicCard } from "./ComicCard";
import { BookOpen, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

export function ComicContinueReading() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ComicHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    getUserComicHistory(user.uid)
      .then(data => setItems(data.slice(0, 10)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleDelete = async (comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      await removeComicHistoryItem(user.uid, comicSlug);
      setItems(prev => prev.filter(item => item.comicSlug !== comicSlug));
    } catch (err) {
      console.error("Delete comic history failed:", err);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <section className="container mx-auto px-6 lg:px-12 py-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <BookOpen className="w-5 h-5 text-orange-500 shadow-orange-500/50" />
          </div>
          <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-white uppercase italic">
            Đọc Tiếp
          </h3>
        </div>
        <Link href="/truyen/lich-su" className="text-orange-500 text-[11px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-all">
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
        {items.map((item) => (
          <SwiperSlide key={item.comicSlug} className="!w-[160px] sm:!w-[200px]">
            <div className="relative group">
              <ComicCard 
                title={item.comicTitle}
                slug={item.comicSlug}
                posterUrl={item.coverUrl}
                latestChapter={`Ch. ${item.chapterName}`}
              />
              
              {/* Progress bar */}
              <div className="absolute bottom-[-8px] left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden z-20">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-1000 bubble-shadow" 
                    style={{ width: `${item.percent || 50}%` }} 
                  />
              </div>

              {/* Delete button - Standardized */}
              <button 
                onClick={(e) => handleDelete(item.comicSlug, e)}
                className="delete-btn-premium"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
