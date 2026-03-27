"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { isMovieInAnyPlaylist } from '@/services/db';
import { isMovieInAnyTopXXPlaylist } from '@/services/topxxDb';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(mod => mod.AuthModal), { ssr: false });
const PlaylistModal = dynamic(() => import('@/components/movie/PlaylistModal').then(mod => mod.PlaylistModal), { ssr: false });

import { cn } from '@/lib/utils';

interface WatchlistBtnProps {
  movieSlug?: string;
  movieCode?: string; // used for XX
  movieTitle: string;
  posterUrl: string;
  variant?: "full" | "compact";
  className?: string;
  isXX?: boolean;
}

export function WatchlistBtn({ movieSlug, movieCode, movieTitle, posterUrl, variant = "full", className, isXX = false }: WatchlistBtnProps) {
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const identifier = isXX ? movieCode : movieSlug;

  const checkSavedStatus = () => {
    if (!identifier) {
      setIsSaved(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isXX) {
      const saved = isMovieInAnyTopXXPlaylist(identifier);
      setIsSaved(saved);
      setLoading(false);
    }
    else if (user) {
      isMovieInAnyPlaylist(user.uid, identifier)
        .then(saved => {
          setIsSaved(saved);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error checking saved status:", err);
          setLoading(false);
        });
    } else {
      setIsSaved(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    checkSavedStatus();
  }, [user, identifier, authLoading, isXX]);

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isXX && !user) {
      setShowAuth(true);
      return;
    }
    setShowPlaylistModal(true);
  };

  const handleCloseModal = () => {
    setShowPlaylistModal(false);
    checkSavedStatus(); 
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleToggle}
          className={cn(
            "group/save relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 shadow-md",
            isSaved ? 'bg-primary text-white' : 'backdrop-blur-xl bg-black/20 text-white',
            loading && "opacity-50 pointer-events-none",
            className
          )}
          title={isSaved ? "Đã lưu" : "Lưu phim"}
        >
          {isSaved ? <BookmarkCheck size={20} fill="currentColor" strokeWidth={0} /> : <Bookmark size={20} />}
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        <PlaylistModal isOpen={showPlaylistModal} onClose={handleCloseModal} movieSlug={movieSlug} movieTitle={movieTitle} posterUrl={posterUrl} isXX={isXX} />
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={handleToggle} 
        variant={isSaved ? "primary" : "secondary"} 
        size="lg" 
        className={cn(
          "rounded-full px-6 h-12 gap-2 transition-all duration-300 font-bold shadow-sm active:scale-95",
          isSaved ? "bg-primary text-white" : "bg-surface text-foreground",
          (loading || authLoading) && "opacity-70",
          className
        )}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck size={18} fill="currentColor" strokeWidth={0} />
        ) : (
          <Bookmark size={18} />
        )}
        {loading ? "Đang tải..." : (isSaved ? "Đã Thêm" : "Lưu Phim")}
      </Button>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PlaylistModal isOpen={showPlaylistModal} onClose={handleCloseModal} movieSlug={movieSlug} movieTitle={movieTitle} posterUrl={posterUrl} isXX={isXX} />
    </>
  );
}
