"use client";

import React, { useEffect, useState } from "react";
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
      
      // Cập nhật lại state cục bộ ngay lập tức để UI mượt mượt
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Lưu vào thư mục</h2>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white bg-white/5 hover:bg-red-500/80 rounded-full p-2 transition-all"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách Playlists */}
        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">Chưa có thư mục nào.</p>
          ) : (
            playlists.map(playlist => {
              const checked = playlist.movies.some(m => m.movieSlug === movieSlug);
              return (
                <button
                  key={playlist.id}
                  onClick={() => toggleMovieInPlaylist(playlist)}
                  disabled={processingId === playlist.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left ${checked ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-base">{playlist.name}</span>
                    <span className="text-xs opacity-70">{playlist.movies.length} phim</span>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${checked ? 'bg-primary border-primary' : 'border-white/20'}`}>
                    {processingId === playlist.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : checked ? (
                      <Check className="w-4 h-4 text-white font-bold" />
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="h-px bg-white/10 w-full" />

        {/* Thêm Playlist mới */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input 
            id="new-playlist-input"
            name="playlist-name"
            type="text" 
            placeholder="Tên thư mục mới..." 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Button 
            type="submit" 
            disabled={!newPlaylistName.trim() || isCreating}
            className="rounded-xl px-4"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </Button>
        </form>

      </div>
    </div>
  );
}
