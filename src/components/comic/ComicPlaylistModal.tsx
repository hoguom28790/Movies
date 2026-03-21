"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";
import { 
  ComicPlaylist, 
  getUserComicPlaylists, 
  createComicPlaylist, 
  addComicToPlaylist, 
  removeComicFromPlaylist,
  ensureDefaultComicPlaylist
} from "@/services/comicDb";
import { Plus, Check, X as CloseIcon, Loader2 } from "lucide-react";

interface ComicPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  comicSlug: string;
  comicTitle: string;
  coverUrl: string;
}

export function ComicPlaylistModal({ isOpen, onClose, comicSlug, comicTitle, coverUrl }: ComicPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<ComicPlaylist[]>([]);
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
        await ensureDefaultComicPlaylist(user.uid);
        const data = await getUserComicPlaylists(user.uid);
        if (isMounted) setPlaylists(data);
      } catch (err) {
        console.error("Lỗi khi tải Playlist truyện:", err);
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
      await createComicPlaylist(user.uid, newPlaylistName.trim());
      setNewPlaylistName("");
      const updated = await getUserComicPlaylists(user.uid);
      setPlaylists(updated);
    } catch (err) {
      console.error("Lỗi khi tạo playlist truyện:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleComicInPlaylist = async (playlist: ComicPlaylist) => {
    setProcessingId(playlist.id);
    const hasComic = playlist.comics.some(c => c.comicSlug === comicSlug);

    try {
      if (hasComic) {
        await removeComicFromPlaylist(playlist.id, comicSlug);
      } else {
        await addComicToPlaylist(playlist.id, { comicSlug, comicTitle, coverUrl });
      }
      
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlist.id) {
          return {
            ...p,
            comics: hasComic 
              ? p.comics.filter(c => c.comicSlug !== comicSlug)
              : [...p.comics, { comicSlug, comicTitle, coverUrl, addedAt: Date.now() }]
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Lỗi cập nhật playlist truyện:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-surface p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md relative flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Lưu vào bộ sưu tập</h2>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold opacity-60">Thư mục cá nhân</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition-all"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/40">
                <Plus className="w-12 h-12 mx-auto opacity-10 mb-4" />
                <p className="font-headline font-bold text-lg uppercase tracking-tighter">Chưa có thư mục nào</p>
            </div>
          ) : (
            playlists.map(playlist => {
              const checked = playlist.comics.some(c => c.comicSlug === comicSlug);
              return (
                <button
                  key={playlist.id}
                  onClick={() => toggleComicInPlaylist(playlist)}
                  disabled={processingId === playlist.id}
                  className={`group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 text-left ${
                      checked 
                        ? 'bg-primary/10 border-primary text-white shadow-lg shadow-primary/5' 
                        : 'bg-white/[0.03] border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-headline font-black text-lg uppercase tracking-tighter">{playlist.name}</span>
                    <span className="font-label text-[10px] uppercase tracking-widest opacity-40">{playlist.comics.length} bộ truyện</span>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      checked ? 'bg-primary border-primary scale-110 shadow-xl shadow-primary/20' : 'border-white/10'
                  }`}>
                    {processingId === playlist.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : checked ? (
                      <Check size={18} className="text-white font-black animate-in zoom-in duration-300" />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="h-px bg-white/10 w-full opacity-50" />

        <form onSubmit={handleCreate} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Tên thư mục mới..." 
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all placeholder:text-white/20"
          />
          <button 
            type="submit" 
            disabled={!newPlaylistName.trim() || isCreating}
            className="bg-primary text-white rounded-2xl px-6 py-4 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-xl shadow-primary/20"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </div>
  );
}
