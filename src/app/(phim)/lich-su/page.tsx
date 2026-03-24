"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, deleteFromHistory } from "@/services/db";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { X, Film } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Separate movie history page in Hồ Phim
export default function MovieHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await deleteFromHistory(user.uid, movieSlug);
      setItems(prev => prev.filter(item => item.movieSlug !== movieSlug));
    } catch (err) {
      console.error("Lỗi khi xóa phim:", err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    getUserHistory(user.uid)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  }, [user, authLoading]);

  if (authLoading || loading) return <div className="p-8 text-center text-foreground/40 mt-24">Đang tải lịch sử xem phim...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center mt-12 flex flex-col items-center">
        <Film className="w-16 h-16 text-foreground/10 mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-foreground">Bạn chưa đăng nhập</h2>
        <p className="text-foreground/40 mb-8">Vui lòng đăng nhập để xem lịch sử xem phim của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-3 rounded-2xl font-bold">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase border-l-4 border-primary pl-4 text-foreground">Lịch Sử Xem Phim</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
          <Film className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">{items.length} Bộ phim</span>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 bg-foreground/[0.02] border border-dashed border-foreground/10 rounded-[30px] flex flex-col items-center">
          <Film className="w-12 h-12 text-foreground/5 mb-4" />
          <p className="text-foreground/50 font-bold uppercase tracking-widest text-sm">Bạn chưa xem bộ phim nào gần đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 animate-in fade-in duration-700">
          {items.map((item, idx) => {
            // Precise progress calculation
            const progressPercent = item.durationSeconds && item.durationSeconds > 0 
              ? Math.max(2, Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100)))
              : (item.progressSeconds > 0 ? 2 : 0);

            const formatTime = (s: number) => {
              const h = Math.floor(s / 3600);
              const m = Math.floor((s % 3600) / 60);
              return h > 0 ? `${h}h${m}m` : `${m}m`;
            };
            const pText = item.progressSeconds > 0 ? `Xem đến ${formatTime(item.progressSeconds)} (${progressPercent}%)` : "Mới xem";
            const watchSource = (item as any).source || 'ophim';
            const watchHref = `/xem/${watchSource}/${item.movieSlug}/${encodeURIComponent(item.episodeName || '1')}`;

            return (
              <MovieCard 
                key={item.id}
                title={item.movieTitle}
                slug={item.movieSlug}
                posterUrl={item.posterUrl}
                episodeText={`Tập ${item.episodeName}`}
                progress={progressPercent}
                progressText={pText}
                customHref={watchHref}
                index={idx}
                onDelete={(e) => handleDelete(item.movieSlug, e)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
