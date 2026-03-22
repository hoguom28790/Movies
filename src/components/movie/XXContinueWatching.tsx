"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getXXFirestoreHistory, deleteXXFirestoreHistoryItem } from "@/services/topxxFirestore";
import { getXXHistory, removeXXHistoryItem, XXHistoryEntry } from "@/services/topxxDb";
import { XXMovieCard } from "./XXMovieCard";
import { Play, X, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

export function XXContinueWatching() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<XXHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchHistory = async () => {
        try {
            if (user) {
                const cloudHistory = await getXXFirestoreHistory(user.uid);
                setItems(cloudHistory.slice(0, 10));
            } else {
                setItems(getXXHistory().slice(0, 10));
            }
        } catch (err) {
            setItems(getXXHistory().slice(0, 10));
        } finally {
            setLoading(false);
        }
    };
    
    fetchHistory();
  }, [user, authLoading]);

  const handleDelete = async (movieCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (user) {
        await deleteXXFirestoreHistoryItem(user.uid, movieCode);
      }
      removeXXHistoryItem(movieCode);
      setItems(prev => prev.filter(item => item.movieCode !== movieCode));
    } catch (err) {
      console.error("Delete TopXX history failed:", err);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <section className="container mx-auto px-6 lg:px-12 py-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Zap className="w-5 h-5 text-yellow-500 shadow-yellow-500/50" />
          </div>
          <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-white uppercase italic tracking-tighter">
            Xem Tiếp (18+)
          </h3>
        </div>
        <Link href="/v2k9r5w8m3x7n1p4q0z6/lich-su" className="text-yellow-500 text-[11px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-all">
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
            : (item.progressSeconds > 0 ? 50 : 0);

           return (
            <SwiperSlide key={item.movieCode} className="!w-[160px] sm:!w-[200px]">
              <div className="relative group overflow-hidden rounded-xl">
                <XXMovieCard 
                  title={item.movieTitle}
                  slug={item.movieCode}
                  posterUrl={item.posterUrl}
                />
                
                {/* Progress bar - Bottom of image area */}
                <div className="absolute bottom-[2.8rem] left-0 right-0 px-2 z-20 pointer-events-none">
                  <div className="progress-bar-premium relative">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-1000 bubble-shadow" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                  </div>
                </div>

                {/* Delete button - Standardized */}
                <button 
                  onClick={(e) => handleDelete(item.movieCode, e)}
                  className="delete-btn-premium !top-2 !right-2"
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
