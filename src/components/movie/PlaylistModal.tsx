"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";
import { Playlist } from "@/types/database";
import { 
  getUserPlaylists, 
  createPlaylist, 
  addMovieToPlaylist, 
  removeMovieFromPlaylist,
  ensureDefaultPlaylist
} from "@/services/db";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X as CloseIcon, Loader2 } from "lucide-react";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
}

export function PlaylistModal({ isOpen, onClose, movieSlug, movieTitle, posterUrl }: PlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    
    const loadPlaylists = async () => {
      setLoading(true);
      try {
        await ensureDefaultPlaylist(user.uid);
        const data = await getUserPlaylists(user.uid);
        if (isMounted) setPlaylists(data);
      } catch (err) {
        console.error("Lỗi khi tải Playlist:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPlaylists();

    return () => { isMounted = false; };
  }, [isOpen, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      await createPlaylist(user.uid, newPlaylistName.trim());
      setNewPlaylistName("");
      const updated = await getUserPlaylists(user.uid);
      setPlaylists(updated);
    } catch (err) {
      console.error("Lỗi khi tạo playlist:", err);
      alert("Không thể tạo thư mục lúc này.");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMovieInPlaylist = async (playlist: Playlist) => {
    setProcessingId(playlist.id);
    const hasMovie = playlist.movies.some(m => m.movieSlug === movieSlug);

    try {
      if (hasMovie) {
        await removeMovieFromPlaylist(playlist.id, movieSlug);
      } else {
        await addMovieToPlaylist(playlist.id, { movieSlug, movieTitle, posterUrl });
      }
      
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlist.id) {
          return {
            ...p,
            movies: hasMovie 
              ? p.movies.filter(m => m.movieSlug !== movieSlug)
              : [...p.movies, { movieSlug, movieTitle, posterUrl, addedAt: Date.now() }]
          };
        }
        return p;
      }));

    } catch (err) {
      console.error("Lỗi cập nhật playlist:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface p-6 md:p-8 rounded-[32px] border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                 <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Lưu vào thư mục</h2>
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mt-1">{movieTitle}</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all shadow-xl"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách Playlists */}
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12 space-y-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                   <Plus className="w-8 h-8 text-white/5 mx-auto" />
                   <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Chưa có thư mục nào</p>
                </div>
              ) : (
                playlists.map(playlist => {
                  const checked = playlist.movies.some(m => m.movieSlug === movieSlug);
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => toggleMovieInPlaylist(playlist)}
                      disabled={processingId === playlist.id}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 text-left active-depth ${checked ? 'bg-primary/10 border-primary/50 text-white shadow-lg shadow-primary/5' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-base uppercase italic tracking-tight leading-none">{playlist.name}</span>
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest italic">{playlist.movies.length} PHIM</span>
                      </div>
                      
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${checked ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'border-white/10'}`}>
                        {processingId === playlist.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-white" />
                        ) : checked ? (
                          <Check className="w-4 h-4 text-white stroke-[3px]" />
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="h-px bg-white/5 w-full shrink-0" />

            {/* Thêm Playlist mới */}
            <form onSubmit={handleCreate} className="flex gap-3">
              <input 
                id="new-playlist-input"
                name="playlist-name"
                type="text" 
                placeholder="Tên thư mục mới..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 focus:bg-black/60 transition-all font-bold"
              />
              <Button 
                type="submit" 
                disabled={!newPlaylistName.trim() || isCreating}
                className="rounded-2xl w-14 h-14 p-0 shadow-xl"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 stroke-[3px]" />}
              </Button>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
