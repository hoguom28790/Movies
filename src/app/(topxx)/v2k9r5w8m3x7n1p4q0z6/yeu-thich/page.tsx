"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, ListMusic, Plus, Heart, Search, Edit2, Check, X as CloseIcon, X } from "lucide-react";
import { 
  getXXPlaylists, deleteXXPlaylist, removeMovieFromXXPlaylist, 
  createXXPlaylist, XXPlaylist, getXXFavorites, toggleXXFavorite, 
  renameXXPlaylist, XXFavoriteEntry 
} from "@/services/topxxDb";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getXXFirestoreFavorites, 
  getUserXXFirestorePlaylists,
  saveXXFirestorePlaylist, 
  deleteXXFirestorePlaylist,
  toggleXXFirestoreFavorite
} from "@/services/topxxFirestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { XXMovieCard } from "@/components/movie/XXMovieCard";

export default function XXLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<XXPlaylist[]>([]);
  const [favorites, setFavorites] = useState<XXFavoriteEntry[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("favorites");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user) {
        const [cloudPl, cloudFav, actorFav] = await Promise.all([
          getUserXXFirestorePlaylists(user.uid),
          getXXFirestoreFavorites(user.uid),
          (await import("@/services/db")).getUserFavoriteActors(user.uid, 'topxx')
        ]);
        setPlaylists(cloudPl);
        setFavorites(cloudFav);
        setFavoriteActors(actorFav);
      } else {
        setPlaylists(getXXPlaylists());
        setFavorites(getXXFavorites());
        setFavoriteActors([]);
      }
    } catch (e) {
      setPlaylists(getXXPlaylists());
      setFavorites(getXXFavorites());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    // Local first
    const newId = createXXPlaylist(newName.trim());
    
    // Sync to Cloud
    if (user) {
      const newPlaylist: XXPlaylist = {
        id: newId,
        name: newName.trim(),
        createdAt: Date.now(),
        movies: []
      };
      await saveXXFirestorePlaylist(user.uid, newPlaylist);
    }
    
    setPlaylists(getXXPlaylists());
    setActivePlaylistId(newId);
    setActiveTab("playlist");
    setNewName("");
    setIsCreating(false);
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xóa Playlist này?")) {
      if (user) {
        await deleteXXFirestorePlaylist(user.uid, id);
      }
      deleteXXPlaylist(id);
      
      const remaining = getXXPlaylists();
      setPlaylists(remaining);
      if (activePlaylistId === id) {
        setActivePlaylistId(null);
        setActiveTab("favorites");
      }
    }
  };

  const handleRenamePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlaylistId || !editNameValue.trim()) return;
    
    renameXXPlaylist(activePlaylistId, editNameValue.trim());
    
    if (user) {
       const pl = playlists.find((p: XXPlaylist) => p.id === activePlaylistId);
       if (pl) {
         pl.name = editNameValue.trim();
         await saveXXFirestorePlaylist(user.uid, pl);
       }
    }
    
    setPlaylists(getXXPlaylists());
    setIsEditingName(false);
  };

  const startEditing = () => {
    const pl = playlists.find((p: XXPlaylist) => p.id === activePlaylistId);
    if (pl) {
      setEditNameValue(pl.name);
      setIsEditingName(true);
    }
  };

  const activePlaylist = playlists.find((p: XXPlaylist) => p.id === activePlaylistId);
  const displayMovies = activeTab === "favorites" ? favorites : (activePlaylist?.movies || []);
  
  const filteredMovies = displayMovies.filter((m: XXFavoriteEntry) => 
    m.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveMovie = async (movie: XXFavoriteEntry) => {
    if (activeTab === "favorites") {
      if (user) await toggleXXFirestoreFavorite(user.uid, movie);
      toggleXXFavorite(movie);
      setFavorites(getXXFavorites());
    } else if (activePlaylistId) {
      removeMovieFromXXPlaylist(activePlaylistId, movie.movieCode);
      if (user && activePlaylist) {
         const updatedPl = { ...activePlaylist };
         updatedPl.movies = updatedPl.movies.filter(m => m.movieCode !== movie.movieCode);
         await saveXXFirestorePlaylist(user.uid, updatedPl);
      }
      setPlaylists(getXXPlaylists());
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar - Navigation & Playlist Manager */}
        <aside className="w-full lg:w-80 space-y-10">
          <div className="space-y-6">
             <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter select-none">Thư Viện</h1>
             
             <div className="space-y-3">
                <button 
                  onClick={() => { setActiveTab("favorites"); setActivePlaylistId(null); setIsEditingName(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    activeTab === "favorites" 
                      ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/20" 
                      : "bg-foreground/5 text-foreground/50 border-foreground/5 hover:bg-foreground/10 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={`w-5 h-5 ${activeTab === "favorites" ? "fill-current" : ""}`} />
                    <span className="font-black uppercase text-sm tracking-widest text-[11px]">Phim Đã Lưu</span>
                  </div>
                  <span className="text-[10px] font-black opacity-40">{favorites.length}</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("actors"); setActivePlaylistId(null); setIsEditingName(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    activeTab === "actors" 
                      ? "bg-primary text-black border-primary shadow-xl shadow-primary/20" 
                      : "bg-foreground/5 text-foreground/50 border-foreground/5 hover:bg-foreground/10 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill={activeTab === "actors" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                     </svg>
                    <span className="font-black uppercase text-sm tracking-widest text-[11px]">Diễn Viên</span>
                  </div>
                  <span className="text-[10px] font-black opacity-40">{favoriteActors.length}</span>
                </button>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">Playlists Của Bạn</h3>
               <button 
                 onClick={() => setIsCreating(true)}
                 className="p-1.5 rounded-lg bg-foreground/5 hover:bg-yellow-500 hover:text-black transition-all"
               >
                 <Plus className="w-4 h-4" />
               </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreate} className="bg-foreground/[0.03] p-4 rounded-2xl border border-foreground/10 animate-in slide-in-from-top-2">
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Tên playlist..." 
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                   className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 outline-none mb-3"
                 />
                 <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1 rounded-lg">Tạo</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreating(false)} className="rounded-lg">Hủy</Button>
                 </div>
              </form>
            )}

            <div className="space-y-2">
              {playlists.map((pl: XXPlaylist) => (
                <div 
                  key={pl.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                    activePlaylistId === pl.id 
                      ? "bg-yellow-500 text-black border-yellow-500 shadow-xl shadow-yellow-500/20" 
                      : "bg-foreground/5 text-foreground/40 border-foreground/5 hover:bg-foreground/10 hover:text-foreground"
                  }`}
                  onClick={() => { setActivePlaylistId(pl.id); setActiveTab("playlist"); setIsEditingName(false); }}
                >
                  <div className="flex items-center gap-3 truncate">
                    <ListMusic className={`w-4 h-4 ${activePlaylistId === pl.id ? "text-black" : "text-foreground/20"}`} />
                    <span className="text-sm font-bold truncate">{pl.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-black uppercase tracking-widest">{pl.movies.length}</span>
                     <button 
                       onClick={(e) => handleDeletePlaylist(pl.id, e)}
                       className={`p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors ${activePlaylistId === pl.id ? "text-black/40" : "text-foreground/20"}`}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
              ))}
              
              {playlists.length === 0 && !isCreating && (
                <div className="py-8 text-center bg-foreground/[0.01] rounded-3xl border border-dashed border-foreground/5">
                   <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest leading-loose">Chưa có<br/>Playlist cá nhân</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-10">
           {activeTab === "actors" ? (
             <div className="space-y-12">
                <h2 className="text-primaryxl md:text-5xl font-black text-foreground tracking-tighter uppercase italic">Diễn Viên Yêu Thích</h2>
                
                {favoriteActors.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-center bg-foreground/[0.02] rounded-[40px] border border-dashed border-foreground/5">
                    <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
                      <Heart className="w-8 h-8 text-foreground/10" />
                    </div>
                    <p className="text-foreground/20 font-black uppercase tracking-[0.2em]">Chưa có diễn viên yêu thích</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-8">
                    {favoriteActors.map(actor => (
                      <div key={actor.id} className="group relative">
                        <div className="relative aspect-[1/1] rounded-[32px] overflow-hidden bg-foreground/5 border border-foreground/10 group-hover:border-primary/50 transition-all shadow-xl group-hover:shadow-2xl group-hover:-translate-y-2">
                          <img 
                            src={
                              (actor.profilePath || actor.profile_path)?.startsWith('http') 
                                ? (actor.profilePath || actor.profile_path)
                                : (actor.profilePath || actor.profile_path ? `https://image.tmdb.org/t/p/w300${actor.profilePath || actor.profile_path}` : "/placeholder-actor.png")
                            } 
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => { e.currentTarget.src = "/placeholder-actor.png" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                              <div className="flex items-center gap-2">
                                 <button 
                                   onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      router.push(`/v2k9r5w8m3x7n1p4q0z6/search?q=${encodeURIComponent(actor.name)}`);
                                   }}
                                   className="px-4 py-2 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                                 >
                                    <Search className="w-3 h-3" /> Tìm Phim
                                 </button>
                                 <span className="px-2 py-1 rounded bg-white/10 text-white text-[8px] font-black uppercase tracking-widest border border-white/10">Yêu Thích</span>
                              </div>
                          </div>
                          
                          {/* Remove Button for Actors */}
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!window.confirm(`Gỡ ${actor.name} khỏi yêu thích?`)) return;
                              const { toggleFavoriteActor } = await import("@/services/db");
                              await toggleFavoriteActor(user!.uid, { ...actor, type: 'topxx' });
                              fetchData();
                            }}
                            className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-red-500 hover:border-red-400 shadow-2xl z-20"
                          >
                             <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-4 text-center px-2">
                          <h4 className="text-[14px] font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1 italic">
                             {actor.name}
                          </h4>
                          <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-1 text-yellow-500/50">DIỄN VIÊN ELITE</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           ) : (
             <>
               {/* Search & Header */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                     <div className="flex items-center gap-4">
                        {isEditingName && activeTab === "playlist" ? (
                          <form onSubmit={handleRenamePlaylist} className="flex items-center gap-2">
                             <input 
                               autoFocus
                               type="text"
                               value={editNameValue}
                               onChange={(e) => setEditNameValue(e.target.value)}
                               className="bg-foreground/10 border border-foreground/20 rounded-xl px-4 py-2 text-2xl md:text-4xl font-black text-foreground uppercase italic tracking-tighter outline-none focus:border-yellow-500/50"
                             />
                             <button type="submit" className="p-2 bg-yellow-500 rounded-xl text-black hover:bg-foreground transition-colors">
                                <Check className="w-6 h-6" />
                             </button>
                             <button type="button" onClick={() => setIsEditingName(false)} className="p-2 bg-foreground/5 rounded-xl text-foreground hover:bg-red-500 transition-colors">
                                <CloseIcon className="w-6 h-6" />
                             </button>
                          </form>
                        ) : (
                          <>
                            <h2 className="text-primaryxl md:text-5xl font-black text-foreground tracking-tighter uppercase italic">
                               {activeTab === "favorites" ? "Phim Đã Lưu" : (activePlaylist?.name || "Chọn Playlist")}
                            </h2>
                            {activeTab === "playlist" && (
                              <button 
                                onClick={startEditing}
                                className="p-3 rounded-2xl bg-foreground/5 text-foreground/40 hover:text-yellow-500 hover:bg-foreground/10 transition-all ml-2"
                              >
                                 <Edit2 className="w-6 h-6" />
                              </button>
                            )}
                          </>
                        )}
                     </div>
                     <p className="text-foreground/30 text-sm font-bold uppercase tracking-widest">
                        {filteredMovies.length} bộ phim
                     </p>
                  </div>

                  <div className="relative group max-w-sm w-full">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-yellow-500 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Tìm trong danh sách..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 focus:bg-foreground/10 transition-all font-medium"
                     />
                  </div>
               </div>

               {/* Movie Grid */}
               {filteredMovies.length === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center text-center bg-foreground/[0.02] rounded-[40px] border border-dashed border-foreground/5">
                    <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
                       <Play className="w-8 h-8 text-foreground/10" />
                    </div>
                    <p className="text-foreground/20 font-black uppercase tracking-[0.2em]">Danh sách này còn trống</p>
                    <Link href="/v2k9r5w8m3x7n1p4q0z6" className="mt-8">
                       <Button variant="secondary" className="rounded-2xl border-foreground/10 px-8 py-6 h-auto font-black uppercase tracking-widest text-[11px]">Khám phá kho phim</Button>
                    </Link>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {filteredMovies.map((movie) => (
                      <div key={`${movie.movieCode}-${movie.addedAt}`} className="relative group">
                         <XXMovieCard 
                           title={movie.movieTitle}
                           slug={movie.movieCode}
                           posterUrl={movie.posterUrl}
                         />
                         
                         <div className="absolute -top-2 -right-2 z-30">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveMovie(movie);
                              }}
                              className="delete-btn-premium"
                              title="Xóa"
                            >
                               <X className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
             </>
           )}
        </main>
      </div>
    </div>

  );
}
