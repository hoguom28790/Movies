"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { isXXFavorite, toggleXXFavorite } from "@/services/xxDb";
import { useAuth } from "@/contexts/AuthContext";
import { toggleXXFirestoreFavorite, isXXFirestoreFavorite } from "@/services/xxFirestore";

interface XXFavoriteBtnProps {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
}

export function XXFavoriteBtn({ movieCode, movieTitle, posterUrl }: XXFavoriteBtnProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        // If logged in, get status from Firestore or fallback to local if needed
        const cloudStatus = await isXXFirestoreFavorite(user.uid, movieCode).catch(() => isXXFavorite(movieCode));
        setIsFav(cloudStatus);
      } else {
        setIsFav(isXXFavorite(movieCode));
      }
    };
    checkStatus();
  }, [movieCode, user]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSyncing(true);
    try {
      if (user) {
        // Cloud Sync
        const newState = await toggleXXFirestoreFavorite(user.uid, {
          movieCode,
          movieTitle,
          posterUrl
        });
        
        // Always mirror to Local for consistency
        toggleXXFavorite({ movieCode, movieTitle, posterUrl });
        setIsFav(newState);
      } else {
        // Local Only
        const newState = toggleXXFavorite({
          movieCode,
          movieTitle,
          posterUrl
        });
        setIsFav(newState);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={syncing}
      className={`group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border min-w-[120px] ${
        isFav 
          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
          : "bg-white/5 text-white/60 border-white/10 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10"
      }`}
    >
      {syncing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isFav ? "fill-current" : ""}`} />
      )}
      {isFav ? "Đã Lưu" : "Lưu Phim"}
    </button>
  );
}
