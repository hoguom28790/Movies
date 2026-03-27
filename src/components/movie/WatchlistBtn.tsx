"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { isMovieInAnyPlaylist } from '@/services/db';
import { AuthModal } from '@/components/auth/AuthModal';
import { PlaylistModal } from '@/components/movie/PlaylistModal';

interface WatchlistBtnProps {
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
  variant?: "full" | "compact";
  className?: string;
}

export function WatchlistBtn({ movieSlug, movieTitle, posterUrl, variant = "full", className }: WatchlistBtnProps) {
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const checkSavedStatus = () => {
    if (!user) {
      setIsSaved(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    isMovieInAnyPlaylist(user.uid, movieSlug)
      .then(saved => {
        setIsSaved(saved);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi kiểm tra phim đã lưu:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (authLoading) return;
    checkSavedStatus();
  }, [user, movieSlug, authLoading]);

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowPlaylistModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaylistModal(false);
    checkSavedStatus(); // re-verify state when user finishes tweaking playlists
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleToggle}
          className={`group/save relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-500 overflow-hidden active-depth
            ${isSaved ? 'bg-primary border-primary shadow-[0_0_20px_rgba(0,99,229,0.3)] opacity-100' : 'glass-pro border-white/10 hover:border-primary/50 opacity-40 group-hover:opacity-100'} 
            border ${loading ? "opacity-50 pointer-events-none" : ""} ${className}`}
          title={isSaved ? "Đã lưu vào danh sách" : "Lưu vào danh sách"}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5 text-white fill-current" />
          ) : (
            <Bookmark className={`w-5 h-5 ${isSaved ? 'text-white' : 'text-white/40 group-hover/save:text-primary'}`} />
          )}
          
          {/* Subtle Glow Effect */}
          <div className={`absolute inset-0 bg-primary/20 blur-[10px] opacity-0 group-hover/save:opacity-100 transition-opacity`} />
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        <PlaylistModal 
          isOpen={showPlaylistModal} 
          onClose={handleCloseModal} 
          movieSlug={movieSlug} 
          movieTitle={movieTitle} 
          posterUrl={posterUrl} 
        />
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={handleToggle} 
        variant={isSaved ? "primary" : "secondary"} 
        size="lg" 
        className={`rounded-full px-8 gap-2 transition-all duration-300 ${loading || authLoading ? "opacity-70" : "opacity-100"} hover:scale-105 ${isSaved ? "bg-gradient-to-r from-primary to-primary shadow-[0_0_30px_rgba(0,99,229,0.5)]" : ""} ${className}`}
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
        {loading ? "Đang xử lý..." : (isSaved ? "Đã Thêm" : "Lưu Phim")}
      </Button>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PlaylistModal 
        isOpen={showPlaylistModal} 
        onClose={handleCloseModal} 
        movieSlug={movieSlug} 
        movieTitle={movieTitle} 
        posterUrl={posterUrl} 
      />
    </>
  );
}
