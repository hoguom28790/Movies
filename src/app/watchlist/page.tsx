"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getUserPlaylists, deletePlaylist, removeMovieFromPlaylist, ensureDefaultPlaylist, updatePlaylistName, createPlaylist } from "@/services/db";
import { Playlist } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash, Library, ChevronDown, ChevronRight, Loader2, Pencil, X, Plus, Heart, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      await ensureDefaultPlaylist(user.uid);
      const data = await getUserPlaylists(user.uid);
      setPlaylists(data);
      if (data.length > 0 && !activePlaylistId) {
        setActivePlaylistId(data[0].id);
      }
    } catch (err) {
      console.error("Lỗi khi tải thư mục:", err);
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
    } catch (err) {
      console.error("Error creating playlist:", err);
    }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!window.confirm(`Xóa toàn bộ thư mục "${name}"?`)) return;
    try {
      await deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (activePlaylistId === id) setActivePlaylistId(playlists.find(p => p.id !== id)?.id || null);
    } catch (err) {
      console.error("Error deleting playlist:", err);
    }
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
    } catch (err) {
      console.error("Lỗi khi xóa phim khỏi thư mục:", err);
    }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Heart className="w-16 h-16 text-white/10 mx-auto mb-6" />
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-white/40 font-bold mb-8">Vui lòng đăng nhập để xem thư viện phim của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-6 rounded-2xl font-black uppercase tracking-widest">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const filteredMovies = (activePlaylist?.movies || []).filter(m => 
    m.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 mt-12 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 space-y-10">
           <div className="space-y-6">
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none select-none">Thư Viện</h1>
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Danh Sách Của Bạn</h3>
                 <button onClick={() => setIsCreating(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-primary transition-all shadow-xl shadow-primary/10">
                    <Plus className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {isCreating && (
             <form onSubmit={handleCreate} className="bg-white/[0.03] p-5 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top-4">
                <input 
                  autoFocus
                  placeholder="Tên thư mục mới..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all mb-3 font-bold"
                />
                <div className="flex gap-2">
                   <Button type="submit" size="sm" className="flex-1 rounded-xl">Lưu</Button>
                   <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreating(false)} className="rounded-xl">Hủy</Button>
                </div>
             </form>
           )}

           <div className="space-y-3">
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setActivePlaylistId(p.id)}
                  className={`group relative p-5 rounded-[24px] cursor-pointer transition-all border ${
                    activePlaylistId === p.id 
                      ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                      : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white"
                  }`}
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 truncate">
                         <Library className={`w-5 h-5 ${activePlaylistId === p.id ? "text-white" : "text-white/20"}`} />
                         <span className="font-bold truncate text-[15px]">{p.name}</span>
                      </div>
                      <span className={`text-[10px] font-black ${activePlaylistId === p.id ? "text-white/60" : "text-white/20"}`}>
                        {p.movies.length}
                      </span>
                   </div>
                   
                   <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id, p.name); }}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                         <Trash className="w-3 h-3" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
               <div className="space-y-3">
                  <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
                    {activePlaylist?.name || "Chọn Thư Mục"}
                  </h2>
                  <div className="flex items-center gap-3">
                     <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                        {filteredMovies.length} PHIM
                     </span>
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                     <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest italic">Personal Collection</span>
                  </div>
               </div>

               <div className="relative group max-w-sm w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Tìm kiếm trong danh sách..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl pl-12 pr-6 py-5 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all font-bold tracking-tight shadow-inner"
                  />
               </div>
            </div>

            {filteredMovies.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-[60px] border border-dashed border-white/5 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                     <Plus className="w-10 h-10 text-white/5" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-white/20 font-black uppercase tracking-[0.3em] text-sm italic">Danh sách trống</p>
                     <p className="text-[11px] text-white/10 font-bold uppercase tracking-widest">Bắt đầu lưu những bộ phim yêu thích của bạn</p>
                  </div>
                  <Link href="/">
                    <Button variant="secondary" className="px-10 py-7 rounded-3xl border-white/10 font-black uppercase tracking-[0.2em] text-[10px]">Tiếp Tục Khám Phá</Button>
                  </Link>
               </div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                  {filteredMovies.map(movie => (
                    <div key={movie.movieSlug} className="group flex flex-col gap-5">
                       <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-primary/30 group-hover:-translate-y-3 group-hover:shadow-primary/10">
                          <img 
                            src={movie.posterUrl} 
                            alt={movie.movieTitle} 
                            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                          
                          <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                             <button 
                               onClick={(e) => handleRemoveMovie(activePlaylistId!, movie.movieSlug, e)}
                               className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-2xl text-red-500 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl"
                             >
                                <X className="w-6 h-6" />
                             </button>
                          </div>

                          <Link href={`/movie/${movie.movieSlug}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                             <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-700 border-4 border-white/10">
                                <Plus className="w-10 h-10 fill-current" />
                             </div>
                          </Link>
                       </div>
                       <Link href={`/movie/${movie.movieSlug}`} className="px-2 space-y-1">
                          <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors line-clamp-2 uppercase italic leading-tight tracking-tighter">{movie.movieTitle}</h3>
                          <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Hồ Phim Original Collection</p>
                       </Link>
                    </div>
                  ))}
               </div>
            )}
        </main>
      </div>

      <style jsx global>{`
        .bg-surface { background-color: #0d0d0d; }
      `}</style>
    </div>
  );
}
