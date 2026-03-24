"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { isMovieInAnyXXPlaylist } from '@/services/topxxDb';
import { AuthModal } from '@/components/auth/AuthModal';
import { XXPlaylistModal } from '@/components/movie/XXPlaylistModal';

interface XXWatchlistBtnProps {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
}

export function XXWatchlistBtn({ movieCode, movieTitle, posterUrl }: XXWatchlistBtnProps) {
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const checkSavedStatus = () => {
    if (!movieCode) {
      setIsSaved(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Even if not logged in, we check local storage
    const saved = isMovieInAnyXXPlaylist(movieCode);
    setIsSaved(saved);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    checkSavedStatus();
  }, [user, movieCode, authLoading]);

  const handleToggle = () => {
    // TopXX allows local playlists, but we encouraged login
    setShowPlaylistModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaylistModal(false);
    checkSavedStatus(); 
  };

  return (
    <>
      <Button 
        onClick={handleToggle} 
        variant={isSaved ? "primary" : "secondary"} 
        size="lg" 
        className={`h-14 rounded-2xl px-8 gap-3 transition-all duration-500 font-black uppercase italic tracking-tighter ${loading || authLoading ? "opacity-70" : "opacity-100"} hover:scale-105 active:scale-95 ${isSaved ? "bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] border-yellow-500" : "bg-white/5 text-white/40 border-white/10 hover:border-yellow-500/50 hover:text-yellow-500"}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="w-5 h-5 fill-current" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
        {loading ? "CHECKING..." : (isSaved ? "Đã Lưu" : "Lưu Phim")}
      </Button>
      
      <XXPlaylistModal 
        isOpen={showPlaylistModal} 
        onClose={handleCloseModal} 
        movieCode={movieCode} 
        movieTitle={movieTitle} 
        posterUrl={posterUrl} 
      />
    </>
  );
}
