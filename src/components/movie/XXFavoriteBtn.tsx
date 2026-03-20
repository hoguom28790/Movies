"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { isXXFavorite, toggleXXFavorite } from "@/services/xxDb";

interface XXFavoriteBtnProps {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
}

export function XXFavoriteBtn({ movieCode, movieTitle, posterUrl }: XXFavoriteBtnProps) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isXXFavorite(movieCode));
  }, [movieCode]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = toggleXXFavorite({
      movieCode,
      movieTitle,
      posterUrl
    });
    setIsFav(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border ${
        isFav 
          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
          : "bg-white/5 text-white/60 border-white/10 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10"
      }`}
    >
      <Heart className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isFav ? "fill-current" : ""}`} />
      {isFav ? "Đã Lưu" : "Lưu Phim"}
    </button>
  );
}
