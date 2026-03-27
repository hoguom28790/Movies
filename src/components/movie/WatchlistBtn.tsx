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

  if (isXX) {
    return (
      <>
        <Button 
          onClick={handleToggle} 
          variant={isSaved ? "primary" : "secondary"} 
          size="lg" 
          className={cn(
            "h-14 rounded-2xl px-8 gap-3 transition-all duration-500 font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95",
            isSaved ? "bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] border-yellow-500 hover:bg-white" : "bg-white/5 text-white/40 border-white/10 hover:border-yellow-500/50 hover:text-yellow-500",
            (loading || authLoading) && "opacity-70",
            className
          )}
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
        <PlaylistModal 
          isOpen={showPlaylistModal} 
          onClose={handleCloseModal} 
          movieCode={movieCode} 
          movieTitle={movieTitle} 
          posterUrl={posterUrl} 
          isXX={true}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleToggle}
          className={cn(
            "group/save relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-500 overflow-hidden active-depth border",
            isSaved ? 'bg-primary border-primary shadow-[0_0_20px_rgba(0,99,229,0.3)] opacity-100' : 'glass-pro border-white/10 hover:border-primary/50 opacity-40 group-hover:opacity-100',
            loading && "opacity-50 pointer-events-none",
            className
          )}
          title={isSaved ? "Đã lưu vào danh sách" : "Lưu vào danh sách"}
        >
          {isSaved ? <BookmarkCheck className="w-5 h-5 text-white fill-current" /> : <Bookmark className={cn("w-5 h-5 text-white/40 group-hover/save:text-primary")} />}
          <div className="absolute inset-0 bg-primary/20 blur-[10px] opacity-0 group-hover/save:opacity-100 transition-opacity" />
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        <PlaylistModal isOpen={showPlaylistModal} onClose={handleCloseModal} movieSlug={movieSlug} movieTitle={movieTitle} posterUrl={posterUrl} />
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
          "rounded-full px-8 gap-2 transition-all duration-300 hover:scale-105",
          (loading || authLoading) ? "opacity-70" : "opacity-100",
          isSaved && "bg-gradient-to-r from-primary to-primary shadow-[0_0_30px_rgba(0,99,229,0.5)]",
          className
        )}
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
        {loading ? "Đang xử lý..." : (isSaved ? "Đã Thêm" : "Lưu Phim")}
      </Button>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PlaylistModal isOpen={showPlaylistModal} onClose={handleCloseModal} movieSlug={movieSlug} movieTitle={movieTitle} posterUrl={posterUrl} />
    </>
  );
}
