"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    
    const loadPlaylists = async () => {
      setLoading(true);
      try {
        if (user) {
          // Try to get from cloud first
          const cloudData = await getUserXXFirestorePlaylists(user.uid);
          if (isMounted) {
             // Combine with local if needed, but for now cloud is source of truth if logged in
             setPlaylists(cloudData.length > 0 ? cloudData : getXXPlaylists());
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
    setProcessingId(playlist.id);
    const hasMovie = playlist.movies.some(m => m.movieCode === movieCode);

    try {
      if (hasMovie) {
        removeMovieFromXXPlaylist(playlist.id, movieCode);
      } else {
        addMovieToXXPlaylist(playlist.id, { movieCode, movieTitle, posterUrl });
      }
      
      // Update local state
      const updatedPlaylists = getXXPlaylists();
      setPlaylists(updatedPlaylists);
      
      // Sync to cloud if user is logged in
      if (user) {
        const updatedPl = updatedPlaylists.find(p => p.id === playlist.id);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141416] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
             <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Thêm vào Playlist</h2>
             <p className="text-[10px] font-bold text-yellow-500/50 uppercase tracking-[0.2em]">TOPXX EXCLUSIVE</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white bg-white/5 hover:bg-red-500/80 rounded-full p-2 transition-all"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* List of Playlists */}
        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 space-y-2">
               <p className="text-sm text-neutral-500 italic">Bạn chưa có playlist nào.</p>
            </div>
          ) : (
            playlists.map(playlist => {
              const checked = playlist.movies.some(m => m.movieCode === movieCode);
              return (
                <button
                  key={playlist.id}
                  onClick={() => toggleMovieInPlaylist(playlist)}
                  disabled={processingId === playlist.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left ${checked ? 'bg-yellow-500/10 border-yellow-500/30 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/10'}`}
                >
                  <div className="flex flex-col">
                    <span className={`font-black uppercase italic tracking-tighter text-base ${checked ? "text-yellow-500" : ""}`}>{playlist.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{playlist.movies.length} VIDEO</span>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${checked ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-white/10'}`}>
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

        <div className="h-px bg-white/5 w-full" />

        {/* Create new playlist */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Tên playlist mới..." 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-white/20"
          />
          <Button 
            type="submit" 
            disabled={!newPlaylistName.trim() || isCreating}
            className="rounded-2xl px-6 bg-yellow-500 text-black hover:bg-white hover:scale-105 transition-all"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
          </Button>
        </form>

      </div>
    </div>
  );
}
