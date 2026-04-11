"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserWatchlist, 
  getUserFavoriteActors, 
  getUserPlaylists, 
  deletePlaylist,
  removeMovieFromPlaylist,
  deleteFromWatchlist,
  removeFavoriteActor
} from "@/services/db";
import { 
  Heart, 
  User, 
  ListMusic, 
  Trash2, 
  PlayCircle, 
  Clock, 
  Film,
  AlertCircle,
  Loader2
} from "lucide-react";
import { getTMDBImageUrl } from "@/services/tmdb";
import { MovieCard } from "@/components/movie/MovieCard";
import { cn } from "@/lib/utils";

type Tab = "watchlist" | "actors" | "playlists";

export default function LibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("watchlist");
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [actors, setActors] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [w, a, p] = await Promise.all([
          getUserWatchlist(user.uid),
          getUserFavoriteActors(user.uid),
          getUserPlaylists(user.uid)
        ]);
        setWatchlist(w || []);
        setActors(a || []);
        setPlaylists(p || []);
      } catch (err) {
        console.error("Error loading library data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleDeletePlaylist = async (id: string) => {
    if (!user || !confirm("Bạn có chắc chắn muốn xóa danh sách phát này?")) return;
    try {
      await deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Không thể xóa danh sách phát");
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string, movieSlug: string) => {
    if (!user) return;
    try {
      await removeMovieFromPlaylist(playlistId, movieSlug);
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
          return { ...p, movies: (p.movies || []).filter((m: any) => m.movieSlug !== movieSlug) };
        }
        return p;
      }));
    } catch (err) {
      alert("Lỗi khi xóa phim");
    }
  };

  const handleDeleteWatchlist = async (movieSlug: string) => {
    if (!user) return;
    try {
      await deleteFromWatchlist(user.uid, movieSlug);
      setWatchlist(prev => prev.filter(m => m.movieSlug !== movieSlug));
    } catch (err) {
      alert("Lỗi khi xóa phim khỏi danh sách đã lưu");
    }
  };

  const handleRemoveActor = async (actorId: string | number) => {
    if (!user || !confirm("Xóa diễn viên này khỏi danh sách yêu thích?")) return;
    try {
      await removeFavoriteActor(user.uid, actorId);
      setActors(prev => prev.filter(a => String(a.id) !== String(actorId)));
    } catch (err) {
      alert("Lỗi khi xóa diễn viên");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-24 h-24 rounded-[32px] bg-foreground/[0.03] flex items-center justify-center mb-8 shadow-apple border border-foreground/5">
           <AlertCircle className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-4 tracking-tighter uppercase italic">Thư Viện Cá Nhân</h1>
        <p className="text-foreground/40 mb-10 text-center max-w-sm font-medium leading-relaxed">
          Đăng nhập để lưu lại những bộ phim yêu thích và tạo danh sách phát của riêng bạn.
        </p>
        <Link 
          href="/auth" 
          className="bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-apple-lg active-depth"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-500 pt-32">
      <div className="container mx-auto px-4 sm:px-8 lg:px-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-foreground/5 pb-12">
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-12 bg-primary rounded-full" />
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] italic">Personal Collection</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none italic uppercase">Thư viện</h1>
           </div>
           
           <nav className="flex gap-2 p-1.5 bg-foreground/[0.03] rounded-[24px] border border-foreground/5 shadow-inner backdrop-blur-xl">
             {[
               { id: "watchlist", label: "Phim Đã Lưu", icon: Heart },
               { id: "actors", label: "Diễn Viên", icon: User },
               { id: "playlists", label: "Playlist", icon: ListMusic }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={cn(
                   "flex items-center gap-3 px-6 py-3.5 rounded-[18px] text-xs font-bold uppercase tracking-widest transition-all duration-500",
                   activeTab === tab.id 
                    ? "bg-background text-foreground shadow-apple border border-foreground/5" 
                    : "text-foreground/30 hover:text-foreground/60"
                 )}
               >
                 <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary fill-current" : "")} />
                 <span className="hidden sm:inline">{tab.label}</span>
               </button>
             ))}
           </nav>
        </div>

        {/* Content Section */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
              <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.4em]">Đang tải dữ liệu</p>
            </div>
          ) : (
            <>
              {activeTab === "watchlist" && (
                watchlist.length === 0 ? (
                  <EmptyState 
                    icon={Heart} 
                    title="Chưa có phim lưu lại" 
                    desc="Các phim bạn lưu trong quá trình xem sẽ xuất hiện ở đây." 
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                    {watchlist.map((m, idx) => (
                      <MovieCard 
                        key={m.movieSlug} 
                        slug={m.movieSlug}
                        title={m.movieTitle}
                        posterUrl={m.posterUrl}
                        onDelete={() => handleDeleteWatchlist(m.movieSlug)}
                        index={idx % 20}
                      />
                    ))}
                  </div>
                )
              )}

              {activeTab === "actors" && (
                actors.length === 0 ? (
                  <EmptyState 
                    icon={User} 
                    title="Chưa lưu diễn viên nào" 
                    desc="Theo dõi các diễn viên bạn yêu thích để xem các tác phẩm mới nhất của họ." 
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-8">
                    {actors.map((a) => (
                      <div key={a.id} className="relative group flex flex-col items-center gap-6">
                        <Link 
                          href={`/dien-vien/${a.id}`} 
                          className="w-full flex flex-col items-center gap-6 active-depth"
                        >
                          <div className="relative w-full aspect-square rounded-[54px] overflow-hidden shadow-apple-lg border border-foreground/5 ring-1 ring-white/5 transition-transform duration-700 group-hover:scale-105">
                            {a.profilePath ? (
                              <img 
                                src={getTMDBImageUrl(a.profilePath, 'w342')!} 
                                alt={a.name} 
                                className="w-full h-full object-cover group-hover:rotate-3 transition-transform duration-1000" 
                              />
                            ) : (
                              <div className="w-full h-full bg-foreground/[0.03] flex items-center justify-center text-foreground/10">
                                <User className="w-16 h-16" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>
                          <p className="text-[14px] font-black text-foreground/80 text-center uppercase tracking-tighter group-hover:text-primary transition-colors line-clamp-1">{a.name}</p>
                        </Link>
                        
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveActor(a.id);
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:scale-110 active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === "playlists" && (
                playlists.length === 0 ? (
                  <EmptyState 
                    icon={ListMusic} 
                    title="Tạo playlist của riêng bạn" 
                    desc="Tổ chức các bộ phim theo chủ đề hoặc cảm xúc riêng." 
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {playlists.map((p) => (
                      <div key={p.id} className="apple-glass rounded-[48px] p-10 space-y-10 shadow-apple border-foreground/5 group hover:shadow-apple-lg transition-all duration-700">
                        <div className="flex items-start justify-between border-b border-foreground/5 pb-8">
                          <div className="space-y-3">
                             <div className="flex items-center gap-3">
                               <PlayCircle className="w-6 h-6 text-primary" />
                               <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tighter leading-none">{p.name}</h3>
                             </div>
                             <div className="flex items-center gap-4 text-foreground/30 text-[10px] font-bold uppercase tracking-widest">
                                <span>{p.movies?.length || 0} Phim</span>
                                <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(p.createdAt).toLocaleDateString("vi-VN")}</span>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleDeletePlaylist(p.id)}
                            className="p-4 rounded-2xl bg-foreground/[0.03] text-foreground/20 hover:text-red-500 hover:bg-red-500/10 transition-all active-depth"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                          {p.movies?.slice(0, 4).map((m: any) => (
                             <div key={m.movieSlug} className="relative aspect-[2/3] rounded-[24px] overflow-hidden group/item shadow-apple border border-foreground/5 cursor-pointer active-depth bg-foreground/[0.03]">
                                <img 
                                  src={getTMDBImageUrl(m.posterUrl || m.poster_path, 'w342') || "https://placehold.co/500x750/111/fff&text=No+Poster"} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110" 
                                  loading="lazy"
                                />
                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Link href={`/xem/${m.movieSlug}`} className="p-3 bg-white rounded-full text-black shadow-xl scale-50 group-hover/item:scale-100 transition-transform">
                                    <PlayCircle className="w-5 h-5" />
                                  </Link>
                                  <button 
                                    onClick={() => handleRemoveFromPlaylist(p.id, m.movieSlug)}
                                    className="p-3 bg-red-500 rounded-full text-white shadow-xl scale-50 group-hover/item:scale-100 transition-transform delay-75"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          ))}
                          {(!p.movies || p.movies.length === 0) && (
                            <div className="col-span-4 py-12 flex flex-col items-center justify-center text-foreground/10 space-y-3">
                               <Film className="w-12 h-12" />
                               <p className="text-[10px] font-bold uppercase tracking-widest">Danh sách trống</p>
                            </div>
                          )}
                        </div>
                        
                        {p.movies?.length > 4 && (
                           <div className="flex justify-center border-t border-foreground/5 pt-8">
                             <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.2em]">Cùng +{p.movies.length - 4} phim khác</span>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-40 bg-foreground/[0.01] border border-dashed border-foreground/5 rounded-[64px] animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 rounded-[36px] bg-foreground/[0.03] flex items-center justify-center mb-8 shadow-apple-lg border border-foreground/5">
        <Icon className="w-10 h-10 text-foreground/10" />
      </div>
      <h3 className="text-2xl font-black text-foreground/60 mb-3 tracking-tight italic uppercase">{title}</h3>
      <p className="text-foreground/20 text-center max-w-sm text-sm font-medium leading-relaxed uppercase tracking-tighter">
        {desc}
      </p>
    </div>
  );
}
