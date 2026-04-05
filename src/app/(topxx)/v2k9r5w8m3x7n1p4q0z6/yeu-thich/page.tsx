"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, ListMusic, Plus, Heart, Search, Edit2, Check, X as CloseIcon, X, User } from "lucide-react";
import { 
  getTopXXPlaylists, deleteTopXXPlaylist, removeMovieFromTopXXPlaylist, 
  createTopXXPlaylist, TopXXPlaylist, getTopXXFavorites, toggleTopXXFavorite, 
  renameTopXXPlaylist, TopXXFavoriteEntry, saveTopXXPlaylists
} from "@/services/topxxDb";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getTopXXFirestoreFavorites, 
  getUserTopXXFirestorePlaylists,
  saveTopXXFirestorePlaylist, 
  deleteTopXXFirestorePlaylist,
  toggleTopXXFirestoreFavorite
} from "@/services/topxxFirestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MovieCard } from "@/components/movie/MovieCard";
import { TOPXX_PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EmptyState = ({ icon: Icon, title, desc, button }: { icon: any, title: string, desc: string, button?: React.ReactNode }) => (
  <div className="py-24 md:py-48 flex flex-col items-center justify-center text-center bg-foreground/[0.01] rounded-[48px] border border-dashed border-foreground/5 animate-in fade-in duration-1000">
    <div className="w-24 h-24 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-8 shadow-inner border border-foreground/5">
      <Icon className="w-10 h-10 text-foreground/10" />
    </div>
    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic mb-3">{title}</h3>
    <p className="text-foreground/30 text-[11px] font-black uppercase tracking-[0.2em] max-w-xs leading-loose italic">{desc}</p>
    {button && <div className="mt-10">{button}</div>}
  </div>
);

export default function TopXXLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<TopXXPlaylist[]>([]);
  const [favorites, setFavorites] = useState<TopXXFavoriteEntry[]>([]);
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
      const localPl = getTopXXPlaylists();
      const localFav = getTopXXFavorites();
      
      if (user) {
        const [cloudPl, cloudFav, actorFav] = await Promise.all([
          getUserTopXXFirestorePlaylists(user.uid),
          getTopXXFirestoreFavorites(user.uid),
          (await import("@/services/db")).getUserFavoriteActors(user.uid, 'topxx')
        ]);
        
        if (cloudPl.length === 0 && localPl.length > 0) {
           const { syncTopXXPlaylistsToFirestore } = await import("@/services/topxxFirestore");
           await syncTopXXPlaylistsToFirestore(user.uid, localPl);
           setPlaylists(localPl);
        } else {
           setPlaylists(cloudPl);
           if (cloudPl.length > 0) saveTopXXPlaylists(cloudPl);
        }
        
        if (cloudFav.length === 0 && localFav.length > 0) {
           const { syncTopXXLocalToFirestore } = await import("@/services/topxxFirestore");
           await syncTopXXLocalToFirestore(user.uid, localFav, []); 
           setFavorites(localFav);
        } else {
           setFavorites(cloudFav);
        }
        
        setFavoriteActors(actorFav);
      } else {
        setPlaylists(localPl);
        setFavorites(localFav);
        setFavoriteActors([]);
      }
    } catch (e) {
      console.error("[TopXX Library] Fetch failed", e);
      setPlaylists(getTopXXPlaylists());
      setFavorites(getTopXXFavorites());
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
    const newId = createTopXXPlaylist(newName.trim());
    if (user) {
      const newPlaylist: TopXXPlaylist = {
        id: newId,
        name: newName.trim(),
        createdAt: Date.now(),
        movies: []
      };
      await saveTopXXFirestorePlaylist(user.uid, newPlaylist);
    }
    setPlaylists(getTopXXPlaylists());
    setActivePlaylistId(newId);
    setActiveTab("playlist");
    setNewName("");
    setIsCreating(false);
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xóa Playlist này?")) {
      if (user) await deleteTopXXFirestorePlaylist(user.uid, id);
      deleteTopXXPlaylist(id);
      const remaining = getTopXXPlaylists();
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
    renameTopXXPlaylist(activePlaylistId, editNameValue.trim());
    if (user) {
       const pl = playlists.find((p: TopXXPlaylist) => p.id === activePlaylistId);
       if (pl) {
         pl.name = editNameValue.trim();
         await saveTopXXFirestorePlaylist(user.uid, pl);
       }
    }
    setPlaylists(getTopXXPlaylists());
    setIsEditingName(false);
  };

  const startEditing = () => {
    const pl = playlists.find((p: TopXXPlaylist) => p.id === activePlaylistId);
    if (pl) {
      setEditNameValue(pl.name);
      setIsEditingName(true);
    }
  };

  const activePlaylist = playlists.find((p: TopXXPlaylist) => p.id === activePlaylistId);
  const displayMovies = activeTab === "favorites" ? favorites : (activePlaylist?.movies || []);
  const filteredMovies = displayMovies.filter((m: TopXXFavoriteEntry) => 
    m.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveMovie = async (movie: TopXXFavoriteEntry) => {
    if (activeTab === "favorites") {
      if (user) await toggleTopXXFirestoreFavorite(user.uid, movie);
      toggleTopXXFavorite(movie);
      setFavorites(getTopXXFavorites());
    } else if (activePlaylistId) {
      removeMovieFromTopXXPlaylist(activePlaylistId, movie.movieCode);
      if (user && activePlaylist) {
         const updatedPl = { ...activePlaylist };
         updatedPl.movies = updatedPl.movies.filter(m => m.movieCode !== movie.movieCode);
         await saveTopXXFirestorePlaylist(user.uid, updatedPl);
      }
      setPlaylists(getTopXXPlaylists());
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-background pt-32 animate-in fade-in duration-1000">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 border-b border-foreground/5 pb-12">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-12 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] italic leading-none">PERSONAL COLLECTION</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter leading-none italic uppercase drop-shadow-2xl select-none">Thư viện</h1>
           </div>
           
           <nav className="flex gap-2 p-2 bg-foreground/[0.03] rounded-[28px] border border-foreground/5 shadow-inner backdrop-blur-3xl overflow-x-auto no-scrollbar">
             {[
               { id: "favorites", label: "Phim Đã Lưu", icon: Heart },
               { id: "actors", label: "Diễn Viên", icon: User },
               { id: "playlists", label: "Playlist", icon: ListMusic }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => { setActiveTab(tab.id); setActivePlaylistId(null); setIsEditingName(false); }}
                 className={cn(
                   "flex items-center gap-3 px-6 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap",
                   activeTab === tab.id || (tab.id === "playlists" && activeTab === "playlist")
                    ? "bg-background text-foreground shadow-2xl border border-foreground/5" 
                    : "text-foreground/30 hover:text-foreground/60"
                 )}
               >
                 <tab.icon className={cn("w-4 h-4", (activeTab === tab.id || (tab.id === "playlists" && activeTab === "playlist")) ? "text-yellow-500 fill-current" : "")} />
                 <span>{tab.label}</span>
               </button>
             ))}
           </nav>
        </div>

        {/* Content Section */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-48 gap-6">
              <div className="w-12 h-12 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] italic">SYNCING CLOUD DATA</p>
            </div>
          ) : (
            <>
              {(activeTab === "favorites" || activeTab === "playlist") && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 px-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        {isEditingName && activeTab === "playlist" ? (
                          <form onSubmit={handleRenamePlaylist} className="flex items-center gap-3">
                             <input 
                                autoFocus
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="bg-foreground/5 border border-foreground/10 rounded-2xl px-6 py-3 text-3xl md:text-5xl font-black text-foreground uppercase italic tracking-tighter outline-none focus:border-yellow-500/50 shadow-inner"
                             />
                             <div className="flex gap-2">
                               <button type="submit" className="p-4 bg-yellow-500 rounded-2xl text-black hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20">
                                  <Check className="w-6 h-6" />
                               </button>
                               <button type="button" onClick={() => setIsEditingName(false)} className="p-4 bg-foreground/5 rounded-2xl text-foreground hover:bg-red-500 hover:text-white transition-all shadow-xl">
                                  <CloseIcon className="w-6 h-6" />
                               </button>
                             </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-6">
                            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic drop-shadow-xl overflow-hidden leading-tight">
                               {activeTab === "favorites" ? "Phim Đã Lưu" : (activePlaylist?.name || "Chọn Playlist")}
                            </h2>
                            {activeTab === "playlist" && (
                              <button 
                                onClick={startEditing}
                                className="p-4 rounded-2xl bg-foreground/5 text-foreground/40 hover:text-yellow-500 hover:bg-foreground/10 transition-all shadow-lg"
                              >
                                 <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            {activeTab === "playlist" && (
                              <button 
                                onClick={() => { setActiveTab("playlists"); setActivePlaylistId(null); }}
                                className="text-[10px] font-black text-foreground/20 uppercase tracking-widest hover:text-foreground transition-colors"
                              >
                                QUAY LẠI
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-foreground/30 text-[11px] font-black uppercase tracking-[0.2em] italic">
                         {filteredMovies.length} AVAILABLE TITLES
                      </p>
                    </div>

                    {displayMovies.length > 0 && (
                      <div className="relative group max-w-sm w-full transition-all">
                        <Search className={cn(
                          "absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500",
                          searchQuery ? "text-yellow-500" : "text-foreground/10 group-focus-within:text-yellow-500"
                        )} />
                        <input 
                          type="text" 
                          placeholder="TÌM KIẾM..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-foreground/[0.02] border border-foreground/5 rounded-[22px] pl-14 pr-6 py-4 text-[10px] text-foreground focus:outline-none focus:border-yellow-500/30 focus:bg-foreground/[0.04] transition-all font-black uppercase tracking-widest shadow-inner placeholder:text-foreground/10"
                        />
                      </div>
                    )}
                  </div>

                  {filteredMovies.length === 0 ? (
                    <EmptyState 
                      icon={Play} 
                      title="Danh sách này còn trống" 
                      desc="Khám phá kho phim và thêm những bộ phim tuyệt vời vào bộ sưu tập của bạn." 
                      button={<Link href={`/${TOPXX_PATH}`}><Button variant="secondary" className="rounded-2xl px-10 py-5 h-auto font-black uppercase tracking-widest text-[11px] border-foreground/5 shadow-xl">KHÁM PHÁ NGAY</Button></Link>}
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-16">
                       {filteredMovies.map((movie) => (
                         <div key={`${movie.movieCode}-${movie.addedAt}`} className="relative group">
                            <MovieCard 
                              title={movie.movieTitle}
                              slug={movie.movieCode}
                              posterUrl={movie.posterUrl}
                              isXX
                            />
                            <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   handleRemoveMovie(movie);
                                 }}
                                 className="w-10 h-10 rounded-full bg-red-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
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

              {activeTab === "actors" && (
                favoriteActors.length === 0 ? (
                   <EmptyState 
                     icon={Heart} 
                     title="Chưa lưu diễn viên nào" 
                     desc="Theo dõi các diễn viên bạn yêu thích để dễ dàng truy cập hồ sơ của họ mọi lúc." 
                   />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10">
                    {favoriteActors.map(actor => (
                      <Link 
                        key={actor.id} 
                        href={`/${TOPXX_PATH}/dien-vien/${actor.id || actor.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="group flex flex-col items-center"
                      >
                        <div className="relative w-full aspect-square rounded-full overflow-hidden border-4 border-foreground/5 shadow-2xl transition-all duration-700 bg-surface group-hover:border-yellow-500/30 group-hover:shadow-yellow-500/40 group-hover:-translate-y-4">
                            <img 
                              src={
                                (actor.profilePath || actor.profile_path || actor.profileImageUrl || actor.profileImage)?.startsWith('http') 
                                  ? (actor.profilePath || actor.profile_path || actor.profileImageUrl || actor.profileImage)
                                  : (actor.profilePath || actor.profile_path 
                                      ? `https://image.tmdb.org/t/p/w500${actor.profilePath || actor.profile_path}` 
                                      : `https://javmodel.com/javdata/uploads/${String(actor.id).replace(/-/g, '_')}150.jpg`)
                              } 
                              alt={actor.name}
                              className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                              referrerPolicy="no-referrer"
                              onError={(e) => { 
                                const target = e.currentTarget;
                                const parts = String(actor.id).split('-');
                                if (parts.length === 2 && !target.src.includes(`${parts[1]}_${parts[0]}`)) {
                                  target.src = `https://javmodel.com/javdata/uploads/${parts[1]}_${parts[0]}150.jpg`;
                                  return;
                                }
                                if (!target.src.includes('placehold.co')) {
                                  target.src = `https://placehold.co/500x500/0f1115/efb11d?text=${encodeURIComponent(actor.name)}`;
                                }
                              }}
                            />
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!window.confirm(`Gỡ ${actor.name} khỏi yêu thích?`)) return;
                              const { toggleFavoriteActor } = await import("@/services/db");
                              await toggleFavoriteActor(user!.uid, { ...actor, type: 'topxx' });
                              fetchData();
                            }}
                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center translate-x-16 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700 hover:bg-red-500 shadow-2xl z-20"
                          >
                             <Trash2 className="w-5 h-5 shadow-inner" />
                          </button>
                        </div>
                        <div className="mt-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-1000 delay-300">
                          <h4 className="text-xl font-black uppercase tracking-tighter text-foreground group-hover:text-yellow-500 transition-colors italic leading-none drop-shadow-lg">
                             {actor.name}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {activeTab === "playlists" && (
                <div className="space-y-12">
                   <div className="flex items-center justify-between px-2">
                      <div className="space-y-2">
                         <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic drop-shadow-xl leading-tight">Mọi Playlist</h2>
                         <p className="text-foreground/30 text-[11px] font-black uppercase tracking-[0.2em] italic">{playlists.length} COLLECTIONS</p>
                      </div>
                      <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-yellow-500 rounded-[22px] text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/20"
                      >
                         <Plus className="w-4 h-4" /> THÊM MỚI
                      </button>
                   </div>

                   {isCreating && (
                    <div className="max-w-xl mx-auto bg-foreground/[0.03] p-10 rounded-[40px] border border-foreground/10 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-center">Tạo Playlist TopXX</h3>
                       <form onSubmit={handleCreate} className="space-y-6">
                           <input 
                             autoFocus
                             type="text" 
                             placeholder="VD: CỰC PHẨM TUẦN QUA..." 
                             value={newName}
                             onChange={(e) => setNewName(e.target.value)}
                             className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-6 py-5 text-lg font-bold text-foreground placeholder:text-foreground/10 focus:border-yellow-500/50 focus:bg-foreground/10 outline-none shadow-inner"
                           />
                           <div className="flex gap-4">
                              <button type="submit" className="flex-1 py-5 bg-yellow-500 rounded-2xl text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-xl shadow-yellow-500/20">XÁC NHẬN TẠO</button>
                              <button type="button" onClick={() => setIsCreating(false)} className="px-10 py-5 bg-foreground/5 rounded-2xl text-foreground/40 font-black uppercase tracking-widest text-xs hover:bg-foreground/10 transition-all">HỦY</button>
                           </div>
                       </form>
                    </div>
                  )}

                  {playlists.length === 0 ? (
                    <EmptyState 
                      icon={ListMusic} 
                      title="Tạo playlist của riêng bạn" 
                      desc="Tổ chức các bộ phim theo chủ đề hoặc phong cách diễn viên yêu thích." 
                    />
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12">
                      {playlists.map((p) => (
                        <div 
                          key={p.id} 
                          className="group relative bg-surface rounded-[48px] p-8 space-y-8 border border-foreground/5 shadow-apple-lg hover:shadow-apple-xl transition-all duration-700 cursor-pointer overflow-hidden animate-in zoom-in-95 delay-100"
                          onClick={() => { setActivePlaylistId(p.id); setActiveTab("playlist"); }}
                        >
                          <div className="flex items-start justify-between border-b border-foreground/5 pb-8 relative z-10">
                            <div className="space-y-3">
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                    <ListMusic className="w-5 h-5 text-yellow-500" />
                                 </div>
                                 <h3 className="text-2xl md:text-3xl font-black text-foreground italic uppercase tracking-tighter leading-none line-clamp-1 group-hover:text-yellow-500 transition-colors">{p.name}</h3>
                               </div>
                               <div className="flex items-center gap-4 text-foreground/30 text-[10px] font-black uppercase tracking-widest italic ml-14">
                                  <span>{p.movies?.length || 0} PHIM ĐÃ LƯU</span>
                                  <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                  <span>TOPXX COLLECTION</span>
                               </div>
                            </div>
                            <button 
                              onClick={(e) => handleDeletePlaylist(p.id, e)}
                              className="p-4 rounded-2xl bg-foreground/[0.03] text-foreground/20 hover:text-white hover:bg-red-500 transition-all active:scale-90 shadow-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 relative z-10">
                            {[0, 1, 2, 3].map((i) => {
                              const movie = p.movies?.[i];
                              return (
                                <div key={i} className="aspect-[2/3] rounded-2xl overflow-hidden bg-foreground/5 border border-foreground/5 ring-1 ring-white/5 transition-transform duration-700 group-hover:scale-105 shadow-xl">
                                  {movie ? (
                                    <img src={movie.posterUrl} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full border-2 border-dashed border-foreground/5 flex items-center justify-center">
                                      <Play className="w-4 h-4 text-foreground/5" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                          <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full bg-yellow-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-10 group-hover:translate-y-0 transition-all duration-500 shadow-2xl z-20">
                             <Play className="w-6 h-6 fill-current ml-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
