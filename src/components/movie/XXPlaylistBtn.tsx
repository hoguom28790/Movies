"use client";

import { useState, useEffect, useRef } from "react";
import { ListPlus, Plus, Check, MoreVertical, Trash2 } from "lucide-react";
import { getXXPlaylists, createXXPlaylist, addMovieToXXPlaylist, isMovieInPlaylist } from "@/services/xxDb";
import { Button } from "@/components/ui/Button";

interface XXPlaylistBtnProps {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
}

export function XXPlaylistBtn({ movieCode, movieTitle, posterUrl }: XXPlaylistBtnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaylists(getXXPlaylists());
    
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createXXPlaylist(newPlaylistName);
    setPlaylists(getXXPlaylists());
    setNewPlaylistName("");
  };

  const toggleMovie = (playlistId: string) => {
    addMovieToXXPlaylist(playlistId, { movieCode, movieTitle, posterUrl });
    setPlaylists([...getXXPlaylists()]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 bg-white/5 text-white/60 border border-white/10 hover:border-yellow-500/50 hover:text-yellow-500 hover:bg-yellow-500/10"
      >
        <ListPlus className="w-4 h-4" />
        Playlist
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-white/10">
             <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Thêm vào danh sách</h4>
             <form onSubmit={handleCreate} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Tạo playlist mới..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
                <button type="submit" className="p-2 bg-yellow-500 text-black rounded-lg hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </button>
             </form>
          </div>

          <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
             {playlists.length === 0 ? (
               <p className="px-5 py-4 text-center text-xs text-white/30 italic font-medium">Bạn chưa có playlist nào</p>
             ) : (
               playlists.map((pl) => {
                 const inPlaylist = pl.movies.some((m: any) => m.movieCode === movieCode);
                 return (
                   <button
                     key={pl.id}
                     onClick={() => toggleMovie(pl.id)}
                     className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors group"
                   >
                     <span className={`text-[13px] font-bold transition-colors ${inPlaylist ? "text-yellow-500" : "text-white/60 group-hover:text-white"}`}>
                        {pl.name}
                     </span>
                     {inPlaylist && <Check className="w-4 h-4 text-yellow-500" />}
                   </button>
                 );
               })
             )}
          </div>
        </div>
      )}
    </div>
  );
}
