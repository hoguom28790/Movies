"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, deleteFromHistory } from "@/services/db";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash2 } from "lucide-react";

export default function HistoryPage() {
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
      alert("Đã xảy ra lỗi khi xóa phim.");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    getUserHistory(user.uid)
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải lịch sử:", err);
        setItems([]);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="p-8 text-center text-neutral-400">Đang tải...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-neutral-400">Vui lòng đăng nhập để xem lịch sử phim của bạn.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 border-l-4 border-primary pl-3">Lịch Sử Xem Phim</h1>
      
      {items.length === 0 ? (
        <p className="text-neutral-400">Bạn chưa xem bộ phim nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map(item => (
            <div key={item.id} className="relative group">
              <MovieCard 
                title={item.movieTitle}
                slug={item.movieSlug}
                posterUrl={item.posterUrl}
              />
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded z-10 shadow-sm border border-white/10 pointer-events-none">
                Đã xem: {item.episodeName}
              </div>
              <button 
                onClick={(e) => handleDelete(item.movieSlug, e)}
                className="absolute top-2 left-2 z-20 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 focus:opacity-100"
                title="Xóa khỏi lịch sử"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
