"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";
import { XXPlaylist } from "@/services/topxxDb";
import { 
  getXXPlaylists, 
  createXXPlaylist, 
  addMovieToXXPlaylist, 
  removeMovieFromXXPlaylist 
} from "@/services/topxxDb";
import { 
  getUserXXFirestorePlaylists, 
  saveXXFirestorePlaylist 
} from "@/services/topxxFirestore";
import { saveXXPlaylists } from "@/services/topxxDb";
import { Plus, Check, X as CloseIcon, Loader2 } from "lucide-react";

interface XXPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
}

export function XXPlaylistModal({ isOpen, onClose, movieCode, movieTitle, posterUrl }: XXPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<XXPlaylist[]>([]);
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
    if (!isOpen) return;

    let isMounted = true;
    
    const loadPlaylists = async () => {
      setLoading(true);
      try {
        if (user) {
          const cloudData = await getUserXXFirestorePlaylists(user.uid);
          if (isMounted) {
             const finalPlaylists = cloudData.length > 0 ? cloudData : getXXPlaylists();
             setPlaylists(finalPlaylists);
             if (cloudData.length > 0) {
               saveXXPlaylists(cloudData);
             }
          }
        } else {
          setPlaylists(getXXPlaylists());
        }
      } catch (err) {
        console.error("Lỗi khi tải Playlist TopXX:", err);
        setPlaylists(getXXPlaylists());
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPlaylists();

    return () => { isMounted = false; };
  }, [isOpen, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const newId = createXXPlaylist(newPlaylistName.trim());
      const localPlaylists = getXXPlaylists();
      const newPl = localPlaylists.find(p => p.id === newId);
      
      if (user && newPl) {
        await saveXXFirestorePlaylist(user.uid, newPl);
      }
      
      setNewPlaylistName("");
      setPlaylists(localPlaylists);
    } catch (err) {
      console.error("Lỗi khi tạo playlist TopXX:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMovieInPlaylist = async (playlist: XXPlaylist) => {
    if (!movieCode) return;
    setProcessingId(playlist.id);
    const hasMovie = playlist.movies.some(m => m.movieCode === movieCode);

    try {
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlist.id) {
          const newMovies = hasMovie 
            ? p.movies.filter(m => m.movieCode !== movieCode)
            : [{ movieCode, movieTitle, posterUrl, addedAt: Date.now() }, ...p.movies];
          return { ...p, movies: newMovies };
        }
        return p;
      }));

      if (hasMovie) {
        removeMovieFromXXPlaylist(playlist.id, movieCode);
      } else {
        addMovieToXXPlaylist(playlist.id, { movieCode, movieTitle, posterUrl });
      }
      
      if (user) {
        const latestPlaylists = getXXPlaylists();
        const updatedPl = latestPlaylists.find(p => p.id === playlist.id);
        if (updatedPl) {
          await saveXXFirestorePlaylist(user.uid, updatedPl);
        }
      }

    } catch (err) {
      console.error("Lỗi cập nhật playlist TopXX:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[#141416] p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6 animate-in zoom-in slide-in-from-bottom-4 duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
             <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Thêm vào Playlist</h2>
             <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest leading-none mt-1">TOPXX PREMIUM</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all shadow-xl"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* List of Playlists */}
        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12 space-y-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                <Plus className="w-8 h-8 text-white/5 mx-auto" />
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Ký ức chưa được đặt tên...</p>
            </div>
          ) : (
            playlists.map(playlist => {
              const checked = playlist.movies.some(m => m.movieCode === movieCode);
              return (
                <button
                  key={playlist.id}
                  onClick={() => toggleMovieInPlaylist(playlist)}
                  disabled={processingId === playlist.id}
                  className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 text-left active-depth ${checked ? 'bg-yellow-500/10 border-yellow-500/30 text-white shadow-lg shadow-yellow-500/5' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/10 shadow-sm'}`}
                >
                  <div className="flex flex-col gap-1">
                    <span className={`font-black uppercase italic tracking-tighter text-base leading-none ${checked ? "text-yellow-500" : ""}`}>{playlist.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 leading-none">{playlist.movies.length} VIDEO</span>
                  </div>
                  
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${checked ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'border-white/10'}`}>
                    {processingId === playlist.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : checked ? (
                      <Check className="w-4 h-4 text-black font-black" />
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="h-px bg-white/5 w-full shrink-0" />

        {/* Create new playlist */}
        <form onSubmit={handleCreate} className="flex gap-3">
          <input 
            id="xx-new-playlist-input"
            name="xx-playlist-name"
            type="text" 
            placeholder="Tên thư mục mới..." 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-yellow-500/40 focus:bg-black/60 transition-all placeholder:text-white/20 font-bold"
          />
          <Button 
            type="submit" 
            disabled={!newPlaylistName.trim() || isCreating}
            className="rounded-2xl w-14 h-14 p-0 bg-yellow-500 text-black hover:bg-white hover:scale-105 transition-all shadow-xl"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-7 h-7 stroke-[3px]" />}
          </Button>
        </form>

      </div>
    </div>,
    document.body
  );
}
