"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { deleteFromHistory } from "@/services/db";
import { getTopXXFirestoreHistory, deleteTopXXFirestoreHistoryItem } from "@/services/topxxFirestore";
import { getTopXXHistory, removeTopXXHistoryItem } from "@/services/topxxDb";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "./MovieCard";
import { History, ChevronRight, PlayCircle, Zap } from "lucide-react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface MovieContinueWatchingProps {
  isXX?: boolean;
}

export function MovieContinueWatching({ isXX = false }: MovieContinueWatchingProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]); // Using any because HistoryEntry and XXHistoryEntry might differ
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (isXX) {
      const fetchXXHistory = async () => {
        try {
          if (user) {
            const cloudHistory = await getTopXXFirestoreHistory(user.uid);
            setItems(cloudHistory.slice(0, 20));
          } else {
            setItems(getTopXXHistory().slice(0, 20));
          }
        } catch (err) {
          setItems(getTopXXHistory().slice(0, 20));
        } finally {
          setLoading(false);
        }
      };
      fetchXXHistory();
      return;
    }

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "reading_history_phim"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let historyItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryEntry[];
      
      const sorted = historyItems.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setItems(sorted.slice(0, 40));
      setLoading(false);
    }, (error) => {
      console.error("Continue Watching Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, isXX]);

  const handleDelete = async (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isXX) {
      try {
        if (user) await deleteTopXXFirestoreHistoryItem(user.uid, itemId);
        removeTopXXHistoryItem(itemId);
        setItems(prev => prev.filter(item => (item.movieCode || item.movieSlug) !== itemId));
      } catch (err) {
        console.error("Delete TopXX history failed:", err);
      }
      return;
    }

    if (!user) return;
    try {
      await deleteFromHistory(user.uid, itemId);
    } catch (err) {
      console.error("Delete history failed:", err);
    }
  };

  if (loading || items.length === 0) return null;

  if (isXX) {
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

        <div className="relative group/swiper">
          <Swiper
            modules={[FreeMode]}
            freeMode={true}
            spaceBetween={16}
            slidesPerView="auto"
            className="!overflow-visible"
          >
            {items.map((item, idx) => {
              const progressPercent = item.durationSeconds && item.durationSeconds > 0 
                ? Math.max(2, Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100)))
                : (item.progressSeconds > 0 ? 2 : 0);

              const formatTime = (s: number) => {
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                return h > 0 ? `${h}h${m}m` : `${m}m`;
              };
              const pText = item.progressSeconds > 0 ? `Xem đến ${formatTime(item.progressSeconds)} (${progressPercent}%)` : "Mới xem";

              return (
                <SwiperSlide key={item.movieCode || idx} className="!w-[160px] sm:!w-[200px]">
                  <MovieCard 
                    title={item.movieTitle}
                    slug={item.movieCode}
                    posterUrl={item.posterUrl}
                    progress={progressPercent}
                    progressText={pText}
                    onDelete={(e) => handleDelete(item.movieCode, e)}
                    isXX={true}
                    index={idx}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6 lg:px-20 py-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-cinematic-xl">
            <History className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-white uppercase italic leading-none drop-shadow-2xl flex items-center gap-4">
              Tiếp tục xem <PlayCircle className="w-8 h-8 md:w-12 md:h-12 fill-primary text-white" />
            </h3>
            <p className="text-[12px] md:text-[14px] text-white/20 font-black uppercase tracking-[0.5em] italic">
              RESUME ARCHIVE PROTOCOL • AI SYNC ACTIVE
            </p>
          </div>
        </div>
        
        <Link 
          href="/lich-su" 
          className="group flex items-center gap-4 px-10 py-5 rounded-[28px] glass-pro bg-black/40 text-[12px] font-black uppercase tracking-[0.3em] italic text-primary border border-primary/20 hover:bg-primary hover:text-white hover:shadow-primary/40 transition-all duration-700 active-depth"
        >
          Tất cả lịch sử
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-3" />
        </Link>
      </div>

      <div className="relative group/swiper -mx-6 lg:-mx-20 px-6 lg:px-20">
        <Swiper
          modules={[FreeMode]}
          freeMode={true}
          spaceBetween={32}
          slidesPerView="auto"
          className="!overflow-visible"
        >
          {items.map((item, idx) => {
            const timeLeft = item.durationSeconds 
              ? Math.max(0, Math.floor((item.durationSeconds - item.progressSeconds) / 60))
              : 0;
            
            const progressText = timeLeft > 1 
              ? `Còn khoảng ${timeLeft} phút` 
              : `Đã xem ${item.progress}%`;

            const watchSource = (item as any).source || 'ophim';
            const epParam = item.episodeSlug || (item.episodeName?.toLowerCase() === "full" ? "full" : (item.episodeName || '1'));
            const watchHref = `/xem/${watchSource}/${item.movieSlug}/${encodeURIComponent(epParam)}`;

            return (
              <SwiperSlide key={item.movieSlug || idx} className="!w-[240px] sm:!w-[340px]">
                <MovieCard 
                  title={item.movieTitle}
                  slug={item.movieSlug}
                  posterUrl={item.posterUrl}
                  episodeText={`Tập ${item.episodeName || "1"}`}
                  progress={item.progress}
                  progressText={progressText}
                  customHref={watchHref}
                  onDelete={(e) => handleDelete(item.movieSlug, e)}
                  index={idx}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
