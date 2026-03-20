"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isFavoriteActor, toggleFavoriteActor } from "@/services/db";

interface FavoriteActorBtnProps {
  actorId: number;
  actorName: string;
  profilePath: string | null;
}

export function FavoriteActorBtn({ actorId, actorName, profilePath }: FavoriteActorBtnProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setLoading(false);
        return;
      }
      const fav = await isFavoriteActor(user.uid, actorId);
      setIsFav(fav);
      setLoading(false);
    }
    check();
  }, [user, actorId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Vui lòng đăng nhập để lưu diễn viên");
      return;
    }

    try {
      const newState = await toggleFavoriteActor(user.uid, {
        id: actorId,
        name: actorName,
        profilePath
      });
      setIsFav(newState);
      // Removed toast, button state change is enough feedback
    } catch (error) {
      alert("Có lỗi xảy ra, thử lại sau");
    }
  };

  if (loading) return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />;

  return (
    <button
      onClick={handleToggle}
      className={`group flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 border ${
        isFav 
          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
          : "bg-white/5 text-white/60 border-white/10 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10"
      }`}
    >
      <Heart className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isFav ? "fill-current" : ""}`} />
      {isFav ? "Đã Lưu" : "Lưu Diễn Viên"}
    </button>
  );
}
