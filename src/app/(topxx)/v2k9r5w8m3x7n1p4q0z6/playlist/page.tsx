"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, ListMusic, Plus, ChevronRight } from "lucide-react";
import { getTopXXPlaylists, deleteTopXXPlaylist, removeMovieFromTopXXPlaylist, createTopXXPlaylist, TopXXPlaylist } from "@/services/topxxDb";
import { Button } from "@/components/ui/Button";
import { TOPXX_PATH } from "@/lib/constants";

export default function XXPlaylistsPage() {
  const [playlists, setPlaylists] = useState<TopXXPlaylist[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const data = getTopXXPlaylists();
    setPlaylists(data);
    if (data.length > 0 && !activeId) {
      setActiveId(data[0].id);
    }
  }, [activeId]);

  const activePlaylist = playlists.find(p => p.id === activeId);

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa Playlist này?")) {
      deleteTopXXPlaylist(id);
      const remaining = getTopXXPlaylists();
      setPlaylists(remaining);
      if (activeId === id) {
        setActiveId(remaining[0]?.id || null);
      }
    }
  };

  const handleRemoveMovie = (playlistId: string, movieCode: string) => {
    removeMovieFromTopXXPlaylist(playlistId, movieCode);
    setPlaylists(getTopXXPlaylists());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newId = createTopXXPlaylist(newName);
    setPlaylists(getTopXXPlaylists());
    setActiveId(newId);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <ListMusic className="w-5 h-5 text-yellow-500" />
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Playlists</h1>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="p-2 bg-white/5 hover:bg-yellow-500 hover:text-black rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreate} className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 animate-in slide-in-from-top-2">
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Tên playlist..." 
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500/50 outline-none mb-3"
               />
               <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1 rounded-lg">Tạo</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreating(false)} className="rounded-lg">Hủy</Button>
               </div>
            </form>
          )}

          <div className="space-y-2">
            {playlists.map(pl => (
              <div 
                key={pl.id}
                className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                  activeId === pl.id 
                    ? "bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20" 
                    : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setActiveId(pl.id)}
              >
                <div className="flex items-center gap-3 truncate">
                  <ListMusic className={`w-4 h-4 ${activeId === pl.id ? "text-black" : "text-white/20"}`} />
                  <span className="text-sm font-bold truncate">{pl.name}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black uppercase tracking-widest">{pl.movies.length}</span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(pl.id); }}
                     className={`p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors ${activeId === pl.id ? "text-black/40" : "text-white/20"}`}
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
            
            {playlists.length === 0 && !isCreating && (
              <div className="py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                 <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Không có playlist nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-[60vh]">
          {activePlaylist ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                 <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{activePlaylist.name}</h2>
                    <p className="text-white/30 text-sm mt-2 font-medium">Bạn có {activePlaylist.movies.length} phim trong danh sách này</p>
                 </div>
              </div>

              {activePlaylist.movies.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Play className="w-8 h-8 text-white/10" />
                   </div>
                   <p className="text-white/20 font-black uppercase tracking-[0.2em]">Playlist này còn trống</p>
                   <Link href=`/${TOPXX_PATH}` className="mt-8">
                      <Button variant="secondary" className="rounded-2xl border-white/10 px-8 py-6 h-auto font-black uppercase tracking-widest text-xs">Đi tìm phim ngay</Button>
                   </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {activePlaylist.movies.map((movie) => (
                    <div key={movie.movieCode} className="group space-y-3">
                       <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:border-yellow-500/50 transition-all duration-500">
                          <img src={movie.posterUrl} alt={movie.movieTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleRemoveMovie(activePlaylist.id, movie.movieCode)}
                               className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md text-red-400 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>

                          <Link href={`/xem/${movie.movieCode}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <div className="w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                                <Play className="w-6 h-6 fill-current ml-1" />
                             </div>
                          </Link>
                       </div>
                       <Link href={`/xem/${movie.movieCode}`}>
                          <h3 className="text-[13px] font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-2 uppercase leading-snug">{movie.movieTitle}</h3>
                       </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-32 opacity-20">
               <h2 className="text-2xl font-black uppercase tracking-widest text-white/50">Chọn hoặc tạo Playlist mới</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
