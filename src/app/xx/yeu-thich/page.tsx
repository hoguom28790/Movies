"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, ListMusic, Plus, Heart, Search, Edit2, Check, X as CloseIcon, X } from "lucide-react";
import { 
  getXXPlaylists, deleteXXPlaylist, removeMovieFromXXPlaylist, 
  createXXPlaylist, XXPlaylist, getXXFavorites, toggleXXFavorite, 
  renameXXPlaylist, XXFavoriteEntry 
} from "@/services/xxDb";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getXXFirestoreFavorites, 
  getUserXXFirestorePlaylists,
  saveXXFirestorePlaylist, 
  deleteXXFirestorePlaylist,
  toggleXXFirestoreFavorite
} from "@/services/xxFirestore";
import { Button } from "@/components/ui/Button";
import { XXMovieCard } from "@/components/movie/XXMovieCard";

export default function XXLibraryPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<XXPlaylist[]>([]);
  const [favorites, setFavorites] = useState<XXFavoriteEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("favorites");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user) {
          const [cloudPl, cloudFav] = await Promise.all([
            getUserXXFirestorePlaylists(user.uid),
            getXXFirestoreFavorites(user.uid)
          ]);
          setPlaylists(cloudPl);
          setFavorites(cloudFav);
        } else {
          setPlaylists(getXXPlaylists());
          setFavorites(getXXFavorites());
        }
      } catch (e) {
        setPlaylists(getXXPlaylists());
        setFavorites(getXXFavorites());
      } finally {
        setLoading(false);
      }
    };
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
       const pl = playlists.find(p => p.id === activePlaylistId);
       if (pl) {
         pl.name = editNameValue.trim();
         await saveXXFirestorePlaylist(user.uid, pl);
       }
    }
    
    setPlaylists(getXXPlaylists());
    setIsEditingName(false);
  };

  const startEditing = () => {
    const pl = playlists.find(p => p.id === activePlaylistId);
    if (pl) {
      setEditNameValue(pl.name);
      setIsEditingName(true);
    }
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const displayMovies = activeTab === "favorites" ? favorites : (activePlaylist?.movies || []);
  
  const filteredMovies = displayMovies.filter(m => 
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
             <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter select-none">Thư Viện</h1>
             
             <div className="space-y-1">
                <button 
                  onClick={() => { setActiveTab("favorites"); setActivePlaylistId(null); setIsEditingName(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    activeTab === "favorites" 
                      ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/20" 
                      : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={`w-5 h-5 ${activeTab === "favorites" ? "fill-current" : ""}`} />
                    <span className="font-black uppercase text-sm tracking-widest text-[11px]">Phim Đã Lưu</span>
                  </div>
                  <span className="text-[10px] font-black opacity-40">{favorites.length}</span>
                </button>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Playlists Của Bạn</h3>
               <button 
                 onClick={() => setIsCreating(true)}
                 className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500 hover:text-black transition-all"
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
                    activePlaylistId === pl.id 
                      ? "bg-yellow-500 text-black border-yellow-500 shadow-xl shadow-yellow-500/20" 
                      : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => { setActivePlaylistId(pl.id); setActiveTab("playlist"); setIsEditingName(false); }}
                >
                  <div className="flex items-center gap-3 truncate">
                    <ListMusic className={`w-4 h-4 ${activePlaylistId === pl.id ? "text-black" : "text-white/20"}`} />
                    <span className="text-sm font-bold truncate">{pl.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-black uppercase tracking-widest">{pl.movies.length}</span>
                     <button 
                       onClick={(e) => handleDeletePlaylist(pl.id, e)}
                       className={`p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors ${activePlaylistId === pl.id ? "text-black/40" : "text-white/20"}`}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
              ))}
              
              {playlists.length === 0 && !isCreating && (
                <div className="py-8 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                   <p className="text-[10px] text-white/20 font-black uppercase tracking-widest leading-loose">Chưa có<br/>Playlist cá nhân</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-10">
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
                           className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter outline-none focus:border-yellow-500/50"
                         />
                         <button type="submit" className="p-2 bg-yellow-500 rounded-xl text-black hover:bg-white transition-colors">
                            <Check className="w-6 h-6" />
                         </button>
                         <button type="button" onClick={() => setIsEditingName(false)} className="p-2 bg-white/5 rounded-xl text-white hover:bg-red-500 transition-colors">
                            <CloseIcon className="w-6 h-6" />
                         </button>
                      </form>
                    ) : (
                      <>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                           {activeTab === "favorites" ? "Phim Đã Lưu" : (activePlaylist?.name || "Chọn Playlist")}
                        </h2>
                        {activeTab === "playlist" && (
                          <button 
                            onClick={startEditing}
                            className="p-2 rounded-xl bg-white/5 text-white/20 hover:text-yellow-500 hover:bg-white/10 transition-all ml-2"
                          >
                             <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                 </div>
                 <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
                    {filteredMovies.length} bộ phim
                 </p>
              </div>

              <div className="relative group max-w-sm w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-yellow-500 transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Tìm trong danh sách..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all font-medium"
                 />
              </div>
           </div>

           {/* Movie Grid */}
           {filteredMovies.length === 0 ? (
             <div className="py-32 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/5">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                   <Play className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.2em]">Danh sách này còn trống</p>
                <Link href="/xx" className="mt-8">
                   <Button variant="secondary" className="rounded-2xl border-white/10 px-8 py-6 h-auto font-black uppercase tracking-widest text-[11px]">Khám phá kho phim</Button>
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
                     
                     <div className="absolute -top-2 -right-2 z-30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveMovie(movie);
                          }}
                          className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl text-white border border-white/10 flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all shadow-xl"
                          title="Xóa"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </main>
      </div>
    </div>

  );
}
