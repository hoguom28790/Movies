"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getUserPlaylists, deletePlaylist, removeMovieFromPlaylist, ensureDefaultPlaylist, updatePlaylistName, createPlaylist } from "@/services/db";
import { getUserComicFavorites, toggleComicFavorite, ComicFavoriteEntry } from "@/services/comicDb";
import { Playlist } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { ComicCard } from "@/components/comic/ComicCard";
import { Trash, Library, ChevronDown, ChevronRight, Loader2, Pencil, X, Plus, Heart, Search, Film, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"movies" | "comics">("movies");
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [comicFavorites, setComicFavorites] = useState<ComicFavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      await ensureDefaultPlaylist(user.uid);
      const [movieData, comicData] = await Promise.all([
        getUserPlaylists(user.uid),
        getUserComicFavorites(user.uid)
      ]);
      
      setPlaylists(movieData);
      setComicFavorites(comicData);
      
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
    } catch (err) { }
  };

  const handleRemoveComicFavorite = async (comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await toggleComicFavorite(user.uid, { comicSlug, comicTitle: "", coverUrl: "" });
      setComicFavorites(prev => prev.filter(c => c.comicSlug !== comicSlug));
    } catch(err) { }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Heart className="w-16 h-16 text-white/10 mx-auto mb-6" />
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-white/40 font-bold mb-8">Vui lòng đăng nhập để xem thư viện yêu thích của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-[14px]">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const filteredMovies = (activePlaylist?.movies || []).filter(m => 
    m.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredComics = comicFavorites.filter(c => 
    c.comicTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 mt-16 animate-in fade-in duration-1000 min-h-[80vh]">
      
      {/* Global Tabs Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/[0.06] pb-6">
        <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none select-none">Tủ Yêu Thích</h1>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl shrink-0 w-fit">
          <button 
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "movies" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Film className="w-4 h-4" /> Phim
          </button>
          <button 
            onClick={() => setActiveTab("comics")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
              activeTab === "comics" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Truyện Tranh
          </button>
        </div>
      </div>

      {activeTab === "movies" ? (
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] space-y-8 flex-shrink-0">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Danh Sách Phim</h3>
                <button onClick={() => setIsCreating(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-primary transition-all shadow-xl shadow-primary/10">
                   <Plus className="w-4 h-4" />
                </button>
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
                    className={`group relative p-4 rounded-2xl cursor-pointer transition-all border ${
                      activePlaylistId === p.id 
                        ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                        : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate">
                           <Library className={`w-4 h-4 flex-shrink-0 ${activePlaylistId === p.id ? "text-white" : "text-white/20"}`} />
                           <span className="font-bold truncate text-[14px]">{p.name}</span>
                        </div>
                        <span className={`text-[10px] font-black pl-2 ${activePlaylistId === p.id ? "text-white/60" : "text-white/20"}`}>
                          {p.movies.length}
                        </span>
                     </div>
                     
                     <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                 <div className="space-y-3">
                    <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
                      {activePlaylist?.name || "Chọn Thư Mục"}
                    </h2>
                    <div className="flex items-center gap-3">
                       <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                          {filteredMovies.length} PHIM
                       </span>
                    </div>
                 </div>

                 <div className="relative group max-w-sm w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                    />
                 </div>
              </div>

              {filteredMovies.length === 0 ? (
                 <div className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5 space-y-6">
                    <Heart className="w-12 h-12 text-white/5" />
                    <div className="space-y-1">
                       <p className="text-white/20 font-black uppercase tracking-[0.2em] text-sm italic">Danh sách trống</p>
                    </div>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredMovies.map(movie => (
                      <div key={movie.movieSlug} className="group relative flex flex-col pt-3">
                         <MovieCard title={movie.movieTitle} slug={movie.movieSlug} posterUrl={movie.posterUrl} />
                         <button 
                           onClick={(e) => handleRemoveMovie(activePlaylistId!, movie.movieSlug, e)}
                           className="absolute top-0 left-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 md:opacity-0 md:group-hover:opacity-100 text-red-500 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl z-20 m-[-8px] md:m-[-12px]"
                         >
                            <X className="w-4 h-4" />
                         </button>
                      </div>
                    ))}
                 </div>
              )}
          </main>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-3">
                 <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
                   Truyện Của Bạn
                 </h2>
                 <div className="flex items-center gap-3 mt-4">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mt-2">
                       {filteredComics.length} TRUYỆN
                    </span>
                 </div>
              </div>

              <div className="relative group max-w-sm w-full sm:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                 <input 
                   type="text"
                   placeholder="Tìm kiếm..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-[13px] text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                 />
              </div>
           </div>

           {filteredComics.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5 space-y-6">
                 <BookOpen className="w-12 h-12 text-white/5" />
                 <div className="space-y-1">
                    <p className="text-white/20 font-black uppercase tracking-[0.2em] text-sm italic">Bạn chưa nhấn Thích truyện nào cả</p>
                 </div>
                 <Link href="/truyen">
                   <Button variant="secondary" className="px-8 rounded-xl font-bold text-xs uppercase">Xem Khám Phá Truyện</Button>
                 </Link>
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                 {filteredComics.map(comic => (
                   <div key={comic.comicSlug} className="group relative pt-3">
                      <ComicCard title={comic.comicTitle} slug={comic.comicSlug} posterUrl={comic.coverUrl} />
                      <button 
                        onClick={(e) => handleRemoveComicFavorite(comic.comicSlug, e)}
                        className="absolute top-0 left-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 md:opacity-0 md:group-hover:opacity-100 text-red-500 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl z-20 m-[-8px] md:m-[-12px]"
                      >
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
              </div>
           )}
        </div>
      )}

      <style jsx global>{`
        .bg-surface { background-color: #0d0d0d; }
      `}</style>
    </div>
  );
}
