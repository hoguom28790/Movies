"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserWatchlist, deleteFromWatchlist } from "@/services/db";
import { WatchlistEntry } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash2 } from "lucide-react";

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await deleteFromWatchlist(user.uid, movieSlug);
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

    getUserWatchlist(user.uid)
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải danh sách lưu:", err);
        setItems([]);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="p-8 text-center text-neutral-400">Đang tải...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-neutral-400">Vui lòng đăng nhập để xem danh sách phim của bạn.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 border-l-4 border-primary pl-3">Danh Sách Phim Đã Lưu</h1>
      
      {items.length === 0 ? (
        <p className="text-neutral-400">Bạn chưa lưu bộ phim nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map(item => (
            <div key={item.id} className="relative group">
              <MovieCard 
                title={item.movieTitle}
                slug={item.movieSlug}
                posterUrl={item.posterUrl}
              />
              <button 
                onClick={(e) => handleDelete(item.movieSlug, e)}
                className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 focus:opacity-100"
                title="Xóa khỏi danh sách"
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
