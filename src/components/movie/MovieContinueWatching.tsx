"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { deleteFromHistory } from "@/services/db";
import { getTopXXFirestoreHistory, deleteTopXXFirestoreHistoryItem } from "@/services/topxxFirestore";
import { getTopXXHistory, removeTopXXHistoryItem } from "@/services/topxxDb";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "./MovieCard";
import { History, ChevronLeft, ChevronRight, PlayCircle, Zap } from "lucide-react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

import { TOPXX_PATH } from "@/lib/constants";

interface MovieContinueWatchingProps {
  isXX?: boolean;
}

export function MovieContinueWatching({ isXX = false }: MovieContinueWatchingProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (isXX) {
      const fetchXXHistory = async () => {
        try {
          if (user) {
            const cloudHistory = await getTopXXFirestoreHistory(user.uid);
            setItems(cloudHistory.slice(0, 10));
          } else {
            setItems(getTopXXHistory().slice(0, 10));
          }
        } catch (err) {
          setItems(getTopXXHistory().slice(0, 10));
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
      setItems(sorted.slice(0, 10));
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

  return (
    <section className="relative w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between px-6 lg:px-12 mb-8 group">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-1.5 h-8 rounded-full",
            isXX ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-primary"
          )} />
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter text-foreground uppercase leading-none">
              Tiếp tục xem
            </h3>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] italic mt-2">
              {isXX ? "Lịch sử xem phim 18+" : "Dựa trên lịch sử của bạn"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            href={isXX ? `/${TOPXX_PATH}/lich-su` : "/lich-su"} 
            className={cn(
              "text-sm font-black hover:opacity-80 transition-all flex items-center gap-2 uppercase tracking-widest italic",
              isXX ? "text-red-500" : "text-primary"
            )}
          >
            Xem tất cả <ChevronRight size={14} />
          </Link>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-6">
            <button className="history-prev w-10 h-10 rounded-full glass-pro text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center border border-foreground/5">
              <ChevronLeft size={20} />
            </button>
            <button className="history-next w-10 h-10 rounded-full glass-pro text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center border border-foreground/5">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative group/swiper">
        <Swiper
          modules={[Navigation, FreeMode]}
          navigation={{
            prevEl: ".history-prev",
            nextEl: ".history-next",
          }}
          freeMode={true}
          spaceBetween={16}
          slidesPerView="auto"
          className="!overflow-visible"
        >
          {items.map((item, idx) => {
            if (!item) return null;
            
            const timeLeft = item.durationSeconds 
              ? Math.max(0, Math.floor((item.durationSeconds - item.progressSeconds) / 60))
              : 0;
            
            const progressText = timeLeft > 1 
              ? `Còn ${timeLeft} phút` 
              : `Đã xem ${item.progress || 0}%`;
 
            const watchSource = (item as any).source || 'ophim';
            const epParam = item.episodeSlug || (item.episodeName?.toLowerCase() === "full" ? "full" : (item.episodeName || '1'));
            
            // Critical survival check for watchHref
            const movieId = item.movieCode || item.movieSlug || item.id;
            if (!movieId) return null;

            const watchHref = isXX 
              ? `/${TOPXX_PATH}/watch/${movieId}` 
              : `/xem/${watchSource}/${item.movieSlug}/${encodeURIComponent(epParam)}`;

            return (
              <SwiperSlide key={(item.movieSlug || item.movieCode || item.id || "") + idx} className="!w-[200px] sm:!w-[280px]">
                <MovieCard 
                  title={item.movieTitle || "Untitled Phim"}
                  slug={isXX ? item.movieCode : item.movieSlug}
                  posterUrl={item.posterUrl}
                  episodeText={item.episodeName ? `Tập ${item.episodeName}` : undefined}
                  progress={item.progress || (item.durationSeconds ? (item.progressSeconds / item.durationSeconds) * 100 : 0)}
                  progressText={progressText}
                  customHref={watchHref}
                  onDelete={(e) => handleDelete(isXX ? item.movieCode : item.movieSlug, e)}
                  isXX={isXX}
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
