"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getUserPlaylists, deletePlaylist, removeMovieFromPlaylist, ensureDefaultPlaylist, createPlaylist, updatePlaylistName } from "@/services/db";
import { Playlist } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash, Library, Loader2, X, Plus, Heart, Search, Film, Edit2, Check, X as CloseIcon, User } from "lucide-react";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  
  const [activeTab, setActiveTab] = useState<'movies' | 'actors'>('movies');
  const [favoriteActors, setFavoriteActors] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      await ensureDefaultPlaylist(user.uid);
      const [movieData, actorData] = await Promise.all([
        getUserPlaylists(user.uid),
        (await import("@/services/db")).getUserFavoriteActors(user.uid)
      ]);
      
      setPlaylists(movieData);
      setFavoriteActors(actorData);
      
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

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylistId || !editNameValue.trim()) return;
    try {
      await updatePlaylistName(activePlaylistId, editNameValue.trim());
      await loadData();
      setIsEditingName(false);
    } catch (err) { }
  };

  const startEditing = () => {
    if (activePlaylist) {
      setEditNameValue(activePlaylist.name);
      setIsEditingName(true);
    }
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
        <Heart className="w-16 h-16 text-foreground/10 mx-auto mb-6" />
        <h2 className="text-4xl font-bold italic tracking-tighter uppercase mb-4 text-foreground">Bạn chưa đăng nhập</h2>
        <p className="text-foreground/40 font-bold mb-8">Vui lòng đăng nhập để xem thư viện phim yêu thích của bạn.</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-foreground/[0.06] pb-8">
        <h1 className="text-4xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">Thư Viện</h1>
        
        {/* Tab Switcher */}
        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-foreground/5">
           <button 
             onClick={() => setActiveTab('movies')}
             className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'movies' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
           >
              🎬 Phim ({playlists.reduce((acc, p) => acc + p.movies.length, 0)})
           </button>
           <button 
             onClick={() => setActiveTab('actors')}
             className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'actors' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
           >
              ✨ Diễn Viên ({favoriteActors.length})
           </button>
        </div>
      </div>

      {activeTab === 'movies' ? (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-[300px] space-y-8 flex-shrink-0">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em]">Danh Sách Thư Mục</h3>
                <button onClick={() => setIsCreating(true)} className="p-2 rounded-xl bg-foreground/5 text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                   <Plus className="w-4 h-4" />
                </button>
             </div>

             {isCreating && (
               <form onSubmit={handleCreate} className="bg-foreground/[0.03] p-5 rounded-3xl border border-foreground/10 shadow-2xl">
                  <input 
                    autoFocus
                    placeholder="Tên thư mục phim..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all mb-3 font-bold"
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
                        ? "bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                        : "bg-foreground/[0.02] text-foreground/40 border-foreground/5 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 truncate font-black italic uppercase tracking-tight">
                           <Library className="w-4 h-4 flex-shrink-0" />
                           <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-black opacity-40">{p.movies.length}</span>
                     </div>
                     
                     <div className="absolute right-3 top-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id, p.name); }}
                          className="p-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-primary-foreground transition-all shadow-xl"
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
                     <div className="flex items-center gap-3">
                       {isEditingName ? (
                         <form onSubmit={handleRename} className="flex items-center gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2 text-2xl md:text-4xl font-black text-foreground uppercase italic tracking-tighter outline-none focus:border-primary/50"
                            />
                            <button type="submit" className="p-2 bg-primary rounded-xl text-primary-foreground hover:opacity-80 transition-opacity">
                               <Check className="w-6 h-6" />
                            </button>
                            <button type="button" onClick={() => setIsEditingName(false)} className="p-2 bg-foreground/5 rounded-xl text-foreground hover:bg-red-500 hover:text-white transition-colors">
                               <CloseIcon className="w-6 h-6" />
                            </button>
                         </form>
                       ) : (
                         <>
                           <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground/90">{activePlaylist?.name}</h2>
                           <button 
                             onClick={startEditing}
                             className="p-2 rounded-xl bg-foreground/5 text-foreground/20 hover:text-primary hover:bg-primary/10 transition-all ml-2"
                           >
                              <Edit2 className="w-5 h-5" />
                           </button>
                         </>
                       )}
                     </div>
                     <div className="mt-2 h-1 w-24 bg-primary rounded-full"></div>
                  </div>

                  <div className="relative max-w-sm w-full sm:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                     <input 
                       type="text"
                       placeholder="Tìm phim trong danh sách..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="w-full bg-foreground/5 border border-foreground/5 rounded-2xl pl-10 pr-4 py-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all font-bold shadow-2xl"
                     />
                  </div>
              </div>

              {filteredMovies.length === 0 ? (
                 <div className="py-24 text-center bg-foreground/[0.01] rounded-[40px] border border-dashed border-foreground/5 space-y-4">
                    <Film className="w-12 h-12 text-foreground/5 mx-auto" />
                    <p className="text-foreground/20 font-black uppercase tracking-widest text-sm">Danh sách trống</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 animate-in slide-in-from-bottom-4 duration-700">
                    {filteredMovies.map(movie => (
                      <div key={movie.movieSlug} className="group relative pt-4">
                         <MovieCard title={movie.movieTitle} slug={movie.movieSlug} posterUrl={movie.posterUrl} />
                         <button 
                           onClick={(e) => handleRemoveMovie(activePlaylistId!, movie.movieSlug, e)}
                           className="delete-btn-premium !top-6 !right-2"
                         >
                            <Trash className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                 </div>
              )}
          </div>
        </div>
      ) : (
        /* Actors Tab Content */
        <div className="animate-in slide-in-from-bottom-4 duration-700">
           {favoriteActors.length === 0 ? (
              <div className="py-32 text-center bg-foreground/[0.01] rounded-[40px] border border-dashed border-foreground/5 space-y-4">
                 <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-foreground/20" />
                 </div>
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground/40">Thư viện diễn viên trống</h3>
                 <p className="text-foreground/10 font-bold uppercase tracking-widest text-xs">Hãy thêm diễn viên bạn yêu thích</p>
              </div>
           ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                 {favoriteActors.map(actor => (
                   <div key={actor.id} className="group relative">
                      <div className="relative aspect-[1/1] rounded-[32px] overflow-hidden bg-foreground/5 border border-foreground/10 group-hover:border-primary/50 transition-all shadow-xl group-hover:shadow-2xl group-hover:-translate-y-2">
                         <img 
                           src={actor.profilePath ? `https://image.tmdb.org/t/p/w300${actor.profilePath}` : "/placeholder-actor.png"} 
                           alt={actor.name}
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                             <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-primary text-white text-[8px] font-black uppercase tracking-widest">Yêu Thích</span>
                             </div>
                         </div>
                         
                         {/* Remove Button for Actors */}
                         <button 
                           onClick={async (e) => {
                             e.preventDefault();
                             if (!window.confirm(`Gỡ ${actor.name} khỏi yêu thích?`)) return;
                             const { toggleFavoriteActor } = await import("@/services/db");
                             await toggleFavoriteActor(user!.uid, actor);
                             loadData();
                           }}
                           className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-red-500 hover:border-red-400 shadow-2xl z-20"
                         >
                            <Trash className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="mt-4 text-center px-2">
                         <h4 className="text-[14px] font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1 italic">
                            {actor.name}
                         </h4>
                         <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-1">DIỄN VIÊN</p>
                      </div>
                   </div>
                 ))}
              </div>
           )}
        </div>
      )}
    </div>
  );
}
