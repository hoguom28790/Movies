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

  return (
    <section className="container mx-auto px-6 lg:px-12 py-8">
      <div className="flex items-center justify-between mb-8 group">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-sm",
            isXX ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
          )}>
            {isXX ? <Zap size={22} fill="currentColor" /> : <History size={22} />}
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {isXX ? "Tiếp tục xem (18+)" : "Tiếp tục xem"}
              <PlayCircle size={20} fill="currentColor" strokeWidth={0} className="text-primary hidden md:inline" />
            </h3>
            <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">
              {isXX ? "Lịch sử xem phim người lớn" : "Dựa trên lịch sử của bạn"}
            </p>
          </div>
        </div>
        
        <Link 
          href={isXX ? `/${TOPXX_PATH}/lich-su` : "/lich-su"} 
          className="text-sm font-bold text-primary hover:opacity-80 transition-all flex items-center gap-1"
        >
          Xem tất cả <ChevronRight size={14} />
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
            const timeLeft = item.durationSeconds 
              ? Math.max(0, Math.floor((item.durationSeconds - item.progressSeconds) / 60))
              : 0;
            
            const progressText = timeLeft > 1 
              ? `Còn ${timeLeft} phút` 
              : `Đã xem ${item.progress || 0}%`;
 
            const watchSource = (item as any).source || 'ophim';
            const epParam = item.episodeSlug || (item.episodeName?.toLowerCase() === "full" ? "full" : (item.episodeName || '1'));
            const watchHref = isXX 
              ? `/${TOPXX_PATH}/watch/${item.movieCode}` 
              : `/xem/${watchSource}/${item.movieSlug}/${encodeURIComponent(epParam)}`;

            return (
              <SwiperSlide key={(item.movieSlug || item.movieCode) + idx} className="!w-[200px] sm:!w-[280px]">
                <MovieCard 
                  title={item.movieTitle}
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
