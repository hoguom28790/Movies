"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Heart } from "lucide-react";
import { getXXFavorites, XXFavoriteEntry } from "@/services/xxDb";
import { Button } from "@/components/ui/Button";

export default function XXFavoritesPage() {
  const [favorites, setFavorites] = useState<XXFavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(getXXFavorites());
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Phim Đã Lưu</h1>
          <p className="text-white/40 text-sm mt-1">Danh sách phim TopXX yêu thích của bạn</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
          <Heart className="w-16 h-16 text-white/5 mb-6" />
          <p className="text-white/30 font-bold uppercase tracking-widest">Chưa có phim yêu thích nào</p>
          <Link href="/xx" className="mt-8">
            <Button className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-sm">Khám phá ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {favorites.map((item) => (
            <Link key={item.movieCode} href={`/xx/movie/${item.movieCode}`} className="group space-y-3">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:border-red-500/50 transition-all duration-500">
                <img src={item.posterUrl} alt={item.movieTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                      <Play className="w-6 h-6 fill-current ml-1" />
                   </div>
                </div>
              </div>
              <h3 className="text-[13px] font-bold text-white group-hover:text-red-500 transition-colors line-clamp-2 uppercase leading-snug">{item.movieTitle}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
