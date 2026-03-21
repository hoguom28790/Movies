"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getUserPlaylists, deletePlaylist, removeMovieFromPlaylist, ensureDefaultPlaylist, createPlaylist } from "@/services/db";
import { Playlist } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash, Library, Loader2, X, Plus, Heart, Search, Film } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Separate movie library page in Hồ Phim
export default function MovieLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      await ensureDefaultPlaylist(user.uid);
      const movieData = await getUserPlaylists(user.uid);
      setPlaylists(movieData);
      if (movieData.length > 0 && !activePlaylistId) {
        setActivePlaylistId(movieData[0].id);
      }
    } catch (err) {
      console.error("Lỗi khi tải thư viện:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user) loadData();
    else setLoading(false);
  }, [user, authLoading]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    try {
      const newId = await createPlaylist(user.uid, newName);
      await loadData();
      setActivePlaylistId(newId);
      setNewName("");
      setIsCreating(false);
    } catch (err) { }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!window.confirm(`Xóa toàn bộ thư mục "${name}"?`)) return;
    try {
      await deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (activePlaylistId === id) setActivePlaylistId(playlists.find(p => p.id !== id)?.id || null);
    } catch (err) { }
  };

  const handleRemoveMovie = async (playlistId: string, movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await removeMovieFromPlaylist(playlistId, movieSlug);
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
          return { ...p, movies: p.movies.filter(m => m.movieSlug !== movieSlug) };
        }
        return p;
      }));
    } catch (err) { }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Heart className="w-16 h-16 text-white/10 mx-auto mb-6" />
        <h2 className="text-4xl font-bold italic tracking-tighter uppercase mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-white/40 font-bold mb-8">Vui lòng đăng nhập để xem thư viện phim yêu thích của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-4 rounded-2xl font-bold uppercase">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const filteredMovies = (activePlaylist?.movies || []).filter(m => 
    m.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-16 mt-8 animate-in fade-in duration-700 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/[0.06] pb-8">
        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Phim Yêu Thích</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-[300px] space-y-8 flex-shrink-0">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Danh Sách Thư Mục</h3>
              <button onClick={() => setIsCreating(true)} className="p-2 rounded-xl bg-white/5 hover:bg-primary transition-all">
                 <Plus className="w-4 h-4" />
              </button>
           </div>

           {isCreating && (
             <form onSubmit={handleCreate} className="bg-white/[0.03] p-5 rounded-3xl border border-white/10 shadow-2xl">
                <input 
                  autoFocus
                  placeholder="Tên thư mục phim..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all mb-3 font-bold"
                />
                <Button type="submit" size="sm" className="w-full rounded-xl">Tạo Thư Mục</Button>
             </form>
           )}

           <div className="space-y-4">
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setActivePlaylistId(p.id)}
                  className={`group relative p-5 rounded-3xl cursor-pointer transition-all border ${
                    activePlaylistId === p.id 
                      ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                      : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white"
                  }`}
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 truncate font-black italic uppercase tracking-tight">
                         <Library className="w-4 h-4 flex-shrink-0" />
                         <span className="truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-black opacity-40">{p.movies.length}</span>
                   </div>
                   
                   <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id, p.name); }}
                        className="p-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
                      >
                         <Trash className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </aside>

        {/* Main */}
        <div className="flex-1 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-primaryxl font-black italic uppercase tracking-tighter text-white/40">{activePlaylist?.name}</h2>
                  <div className="mt-2 h-1 w-24 bg-primary rounded-full"></div>
                </div>

                <div className="relative max-w-sm w-full sm:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                   <input 
                     type="text"
                     placeholder="Tìm phim trong danh sách..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-[14px] text-white focus:outline-none focus:border-primary/50 transition-all font-bold shadow-2xl"
                   />
                </div>
            </div>

            {filteredMovies.length === 0 ? (
               <div className="py-24 text-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 space-y-4">
                  <Film className="w-12 h-12 text-white/5 mx-auto" />
                  <p className="text-white/20 font-black uppercase tracking-widest text-sm">Danh sách trống</p>
               </div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 animate-in slide-in-from-bottom-4 duration-700">
                  {filteredMovies.map(movie => (
                    <div key={movie.movieSlug} className="group relative pt-4">
                       <MovieCard title={movie.movieTitle} slug={movie.movieSlug} posterUrl={movie.posterUrl} />
                       <button 
                         onClick={(e) => handleRemoveMovie(activePlaylistId!, movie.movieSlug, e)}
                         className="absolute top-0 left-0 w-10 h-10 rounded-full bg-black/80 text-red-500 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl z-20 m-[-12px] opacity-0 group-hover:opacity-100"
                       >
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                  ))}
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
