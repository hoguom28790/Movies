"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserWatchlist } from "@/services/db";
import { WatchlistEntry } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
            <MovieCard 
              key={item.id}
              title={item.movieTitle}
              slug={item.movieSlug}
              posterUrl={item.posterUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
