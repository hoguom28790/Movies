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
import {
  getTopXXPlaylists,
  createTopXXPlaylist,
  addMovieToTopXXPlaylist,
  removeMovieFromTopXXPlaylist,
  saveTopXXPlaylists
} from "@/services/topxxDb";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X as CloseIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieSlug?: string;
  movieCode?: string; // used for XX
  movieTitle: string;
  posterUrl: string;
  isXX?: boolean;
}

export function PlaylistModal({ isOpen, onClose, movieSlug, movieCode, movieTitle, posterUrl, isXX = false }: PlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const identifier = isXX ? movieCode : movieSlug;

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
        if (isXX) {
          if (user) {
            const { getUserTopXXFirestorePlaylists } = await import("@/services/topxxFirestore");
            const cloudData = await getUserTopXXFirestorePlaylists(user.uid);
            if (isMounted) {
               const finalPlaylists = cloudData.length > 0 ? cloudData : getTopXXPlaylists();
               setPlaylists(finalPlaylists);
               if (cloudData.length > 0) saveTopXXPlaylists(cloudData);
            }
          } else {
            setPlaylists(getTopXXPlaylists());
          }
        } else if (user) {
          await ensureDefaultPlaylist(user.uid);
          const data = await getUserPlaylists(user.uid);
          if (isMounted) setPlaylists(data);
        }
      } catch (err) {
        if (isXX) setPlaylists(getTopXXPlaylists());
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPlaylists();
    return () => { isMounted = false; };
  }, [isOpen, user, isXX]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      if (isXX) {
        const newId = createTopXXPlaylist(newPlaylistName.trim());
        const localPlaylists = getTopXXPlaylists();
        const newPl = localPlaylists.find(p => p.id === newId);
        if (user && newPl) {
          const { saveTopXXFirestorePlaylist } = await import("@/services/topxxFirestore");
          await saveTopXXFirestorePlaylist(user.uid, newPl);
        }
        setPlaylists(localPlaylists);
      } else if (user) {
        await createPlaylist(user.uid, newPlaylistName.trim());
        const updated = await getUserPlaylists(user.uid);
        setPlaylists(updated);
      }
      setNewPlaylistName("");
    } catch (err) {
       console.error("Create playlist error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMovieInPlaylist = async (playlist: any) => {
    if (!identifier) return;
    setProcessingId(playlist.id);
    const hasMovie = isXX 
      ? playlist.movies.some((m: any) => m.movieCode === identifier)
      : playlist.movies.some((m: any) => m.movieSlug === identifier);

    try {
      if (isXX) {
        if (hasMovie) removeMovieFromTopXXPlaylist(playlist.id, identifier);
        else addMovieToTopXXPlaylist(playlist.id, { movieCode: identifier, movieTitle, posterUrl });
        
        const localPlaylists = getTopXXPlaylists();
        setPlaylists(localPlaylists);
        
        if (user) {
          const updatedPl = localPlaylists.find(p => p.id === playlist.id);
          if (updatedPl) {
            const { saveTopXXFirestorePlaylist } = await import("@/services/topxxFirestore");
            await saveTopXXFirestorePlaylist(user.uid, updatedPl);
          }
        }
      } else if (user) {
        if (hasMovie) await removeMovieFromPlaylist(playlist.id, identifier);
        else await addMovieToPlaylist(playlist.id, { movieSlug: identifier, movieTitle, posterUrl });
        
        const updated = await getUserPlaylists(user.uid);
        setPlaylists(updated);
      }
    } catch (err) {
      console.error("Toggle movie error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && ( identifier && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-hidden" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6",
              isXX ? "bg-[#141416]" : "bg-surface"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                 <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{isXX ? "Thêm vào Playlist" : "Lưu vào thư mục"}</h2>
                 <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-none mt-1", isXX ? "text-yellow-500" : "text-white/30")}>{isXX ? "TOPXX PREMIUM" : movieTitle}</p>
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all shadow-xl"><CloseIcon className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className={cn("w-8 h-8 animate-spin", isXX ? "text-yellow-500" : "text-primary")} /></div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-12 space-y-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                    <Plus className="w-8 h-8 text-white/5 mx-auto" /><p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{isXX ? "Ký ức chưa được đặt tên..." : "Chưa có thư mục nào"}</p>
                </div>
              ) : (
                playlists.map(playlist => {
                  const checked = isXX ? playlist.movies.some((m: any) => m.movieCode === identifier) : playlist.movies.some((m: any) => m.movieSlug === identifier);
                  return (
                    <button key={playlist.id} onClick={() => toggleMovieInPlaylist(playlist)} disabled={processingId === playlist.id} className={cn(
                      "flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 text-left active-depth",
                      checked 
                        ? (isXX ? 'bg-yellow-500/10 border-yellow-500/30 text-white shadow-lg' : 'bg-primary/10 border-primary/50 text-white shadow-lg') 
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                    )}>
                      <div className="flex flex-col gap-1">
                        <span className={cn("font-black uppercase italic tracking-tighter text-base leading-none", checked && isXX && "text-yellow-500")}>{playlist.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 leading-none">{playlist.movies.length} {isXX ? "VIDEO" : "PHIM"}</span>
                      </div>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                        checked 
                          ? (isXX ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-primary border-primary shadow-lg') 
                          : 'border-white/10'
                      )}>
                        {processingId === playlist.id ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : checked && (isXX ? <Check className="w-4 h-4 text-black font-black" /> : <Check className="w-4 h-4 text-white stroke-[3px]" />)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="h-px bg-white/5 w-full shrink-0" />
            <form onSubmit={handleCreate} className="flex gap-3">
              <input type="text" placeholder="Tên thư mục mới..." value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} className={cn("flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:bg-black/60 transition-all placeholder:text-white/20 font-bold", isXX ? "focus:border-yellow-500/40" : "focus:border-primary/40")} />
              <Button type="submit" disabled={!newPlaylistName.trim() || isCreating} className={cn("rounded-2xl w-14 h-14 p-0 shadow-xl", isXX ? "bg-yellow-500 text-black hover:bg-white" : "")}>
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-7 h-7 stroke-[3px]" />}
              </Button>
            </form>
          </motion.div>
        </div>
      ))}
    </AnimatePresence>,
    document.body
  );
}
