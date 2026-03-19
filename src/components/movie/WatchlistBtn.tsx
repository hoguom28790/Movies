"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toggleWatchlist, isInWatchlist } from '@/services/db';
import { AuthModal } from '@/components/auth/AuthModal';

interface WatchlistBtnProps {
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
}

export function WatchlistBtn({ movieSlug, movieTitle, posterUrl }: WatchlistBtnProps) {
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Nếu AuthContext đang tải, khoan cập nhật nút lưu phim
    if (authLoading) return;

    if (!user) {
      setIsSaved(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    isInWatchlist(user.uid, movieSlug)
      .then(saved => {
        setIsSaved(saved);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi kiểm tra phim đã lưu:", err);
        setLoading(false); // Đảm bảo nút không bị kẹt disabled
      });
  }, [user, movieSlug, authLoading]);

  const handleToggle = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const newStatus = await toggleWatchlist(user.uid, {
        movieSlug,
        movieTitle,
        posterUrl,
      });
      setIsSaved(newStatus);
    } catch (err) {
      console.error("Lỗi khi lưu phim:", err);
      alert("Đã xảy ra lỗi khi lưu phim. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleToggle} 
        variant={isSaved ? "primary" : "secondary"} 
        size="lg" 
        className={`rounded-full px-8 gap-2 transition-all duration-300 ${loading || authLoading ? "opacity-70" : "opacity-100"} hover:scale-105 ${isSaved ? "bg-gradient-to-r from-primary to-blue-500 shadow-[0_0_30px_rgba(0,99,229,0.5)]" : ""}`}
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
        {loading ? "Đang xử lý..." : (isSaved ? "Đã Thêm" : "Lưu Phim")}
      </Button>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
