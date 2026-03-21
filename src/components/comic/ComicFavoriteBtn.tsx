"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toggleComicFavorite, isComicFavorite } from "@/services/comicDb";

export function ComicFavoriteBtn({ slug, title, posterUrl }: { slug: string, title: string, posterUrl: string }) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      isComicFavorite(user.uid, slug).then(setIsFavorite).finally(() => setLoading(false));
    } else {
      setIsFavorite(false);
      setLoading(false);
    }
  }, [user, slug]);

  const handleToggle = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng yêu thích");
      return;
    }
    const previous = isFavorite;
    setIsFavorite(!isFavorite); // optimistic
    
    try {
      await toggleComicFavorite(user.uid, {
        comicSlug: slug,
        comicTitle: title,
        coverUrl: posterUrl,
      });
    } catch (e) {
      setIsFavorite(previous);
      alert("Đã xảy ra lỗi khi lưu vào yêu thích");
    }
  };

  if (loading) return null;

  return (
    <button 
      onClick={handleToggle}
      className={`flex items-center justify-center p-3 rounded-xl border transition-all duration-300 w-[45px] h-[45px] hover:scale-105 active:scale-95
        ${isFavorite 
          ? "bg-primary/20 border-primary/30 text-primary" 
          : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
        }`}
      title={isFavorite ? "Đã yêu thích" : "Yêu thích"}
    >
      <Heart className={`w-[18px] h-[18px] transition-all duration-300 ${isFavorite ? "fill-current scale-110" : ""}`} />
    </button>
  );
}
