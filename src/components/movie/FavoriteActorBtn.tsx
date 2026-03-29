"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isFavoriteActor, toggleFavoriteActor } from "@/services/db";

import { cn } from "@/lib/utils";
 
interface FavoriteActorBtnProps {
  actorId: number | string;
  actorName: string;
  profilePath: string | null;
  className?: string;
  type?: 'movie' | 'topxx';
}
 
export function FavoriteActorBtn({ actorId, actorName, profilePath, className, type = 'movie' }: FavoriteActorBtnProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    async function check() {
      if (!user) {
        setLoading(false);
        return;
      }
      const fav = await isFavoriteActor(user.uid, actorId, type);
      setIsFav(fav);
      setLoading(false);
    }
    check();
  }, [user, actorId, type]);
 
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
        profilePath,
        type: type
      });
      setIsFav(newState);
    } catch (error) {
      alert("Có lỗi xảy ra, thử lại sau");
    }
  };
 
  if (loading) return <div className="w-10 h-10 rounded-full bg-foreground/5 animate-pulse" />;
 
  const isXX = type === 'topxx';

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "group flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 border",
        isFav 
          ? (isXX ? "bg-yellow-500 text-black border-yellow-500 shadow-xl shadow-yellow-500/20" : "bg-red-500 text-white border-red-500 shadow-apple-lg shadow-red-500/10")
          : (isXX 
              ? "bg-foreground/5 text-foreground/40 border-foreground/5 hover:border-yellow-500/30 hover:text-yellow-500 hover:bg-yellow-500/5"
              : "bg-foreground/5 text-foreground/40 border-foreground/5 hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5"
            ),
        className
      )}
    >
      <Heart className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isFav ? "fill-current" : "")} />
      <span>{isFav ? "Đã Theo Dõi" : "Theo Dõi"}</span>
    </button>
  );
}
