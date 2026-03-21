"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { 
  getUserComicPlaylists, 
  deleteComicPlaylist, 
  removeComicFromPlaylist, 
  createComicPlaylist, 
  ComicPlaylist,
  ensureDefaultComicPlaylist,
  getUserComicFavorites,
  toggleComicFavorite
} from "@/services/comicDb";
import { ComicCard } from "@/components/comic/ComicCard";
import { 
  Trash2, 
  Library, 
  Loader2, 
  X, 
  Plus, 
  Heart, 
  Search, 
  BookOpen, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ComicLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<ComicPlaylist[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"favorites" | string>("favorites");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await ensureDefaultComicPlaylist(user.uid);
      const [playlistData, favoriteData] = await Promise.all([
        getUserComicPlaylists(user.uid),
        getUserComicFavorites(user.uid)
      ]);
      setPlaylists(playlistData);
      setFavorites(favoriteData);
    } catch (err) {
      console.error("Lỗi khi tải thư viện truyện:", err);
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
      const newId = await createComicPlaylist(user.uid, newName);
      await loadData();
      setActiveTab(newId);
      setNewName("");
      setIsCreating(false);
    } catch (err) { }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!window.confirm(`Xóa toàn bộ thư mục "${name}"?`)) return;
    try {
      await deleteComicPlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (activeTab === id) setActiveTab("favorites");
    } catch (err) { }
  };

  const handleRemoveItem = async (playlistId: string | "favorites", comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (playlistId === "favorites") {
        await toggleComicFavorite(user.uid, { comicSlug, comicTitle: "", coverUrl: "" });
        setFavorites(prev => prev.filter(c => c.comicSlug !== comicSlug));
      } else {
        await removeComicFromPlaylist(playlistId, comicSlug);
        setPlaylists(prev => prev.map(p => {
          if (p.id === playlistId) {
            return { ...p, comics: p.comics.filter(c => c.comicSlug !== comicSlug) };
          }
          return p;
        }));
      }
    } catch (err) { }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-40 text-center theme-truyen">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10 mx-auto">
            <Heart className="w-12 h-12 text-white/20" />
        </div>
        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-6 leading-none">Bạn chưa đăng nhập</h2>
        <p className="text-white/40 font-bold mb-12 max-w-sm mx-auto">Đăng nhập để xem tủ truyện yêu thích và các bộ sưu tập cá nhân của bạn.</p>
        <Link href="/login">
            <Button className="px-12 py-8 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20">Đăng Nhập Ngay</Button>
        </Link>
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === activeTab);
  const currentItems = activeTab === "favorites" ? favorites : (activePlaylist?.comics || []);
  const filteredItems = currentItems.filter((item: any) => 
    (item.comicTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 md:px-24 py-16 mt-16 animate-in fade-in duration-1000 min-h-[90vh] theme-truyen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 border-b border-white/5 pb-12">
        <div className="space-y-4">
           <span className="font-label text-primary uppercase tracking-[0.5em] font-black text-xs opacity-60">Thư viện cá nhân</span>
           <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.8] select-none">Tủ Truyện</h1>
        </div>

        <div className="relative group max-w-sm w-full md:w-96">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-all" />
           <input 
             type="text"
             placeholder="Tìm truyện trong tủ..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full bg-[#111111] border border-white/5 rounded-[2rem] pl-12 pr-6 py-5 text-[15px] text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all font-bold shadow-2xl"
           />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Sidebar */}
        <aside className="w-full lg:w-[350px] space-y-10 flex-shrink-0">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Danh Sách Bộ Sưu Tập</h3>
              <button 
                onClick={() => setIsCreating(true)} 
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-primary text-white transition-all flex items-center justify-center group"
              >
                 <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
           </div>

           {isCreating && (
             <form onSubmit={handleCreate} className="bg-surface p-6 rounded-[2.5rem] border border-white/10 shadow-3xl animate-in slide-in-from-top-4">
                <input 
                  autoFocus
                  placeholder="Tên bộ sưu tập truyện..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all mb-4 font-black uppercase tracking-tight placeholder:text-white/20"
                />
                <div className="flex gap-3">
                    <Button type="submit" size="sm" className="flex-1 rounded-xl h-12 uppercase font-black tracking-widest text-[10px]">Tạo Mới</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreating(false)} className="rounded-xl h-12 px-6 uppercase font-black tracking-widest text-[10px]">Hủy</Button>
                </div>
             </form>
           )}

           <div className="space-y-4">
              {/* Favorites Virtual Item */}
              <div 
                onClick={() => setActiveTab("favorites")}
                className={`group relative p-6 rounded-[2rem] cursor-pointer transition-all border ${
                  activeTab === "favorites" 
                    ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.05] translate-x-2" 
                    : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5 font-black uppercase tracking-tighter italic text-xl">
                        <Heart className={`w-5 h-5 ${activeTab === "favorites" ? "fill-current" : ""}`} />
                        <span className="truncate">Yêu Thích</span>
                    </div>
                    <span className="text-xs font-black opacity-40">{favorites.length}</span>
                  </div>
              </div>

              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  className={`group relative p-6 rounded-[2rem] cursor-pointer transition-all border ${
                    activeTab === p.id 
                      ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.05] translate-x-2" 
                      : "bg-white/[0.02] text-white/40 border-white/5 hover:bg-white/5 hover:text-white"
                  }`}
                >
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-5 font-black uppercase tracking-tighter italic text-xl truncate">
                         <Library className="w-5 h-5 flex-shrink-0" />
                         <span className="truncate">{p.name}</span>
                      </div>
                      <span className="text-xs font-black opacity-40">{p.comics.length}</span>
                   </div>
                   
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(p.id, p.name); }}
                        className={`p-2.5 rounded-xl transition-all shadow-xl ${
                            activeTab === p.id ? "bg-white/10 hover:bg-black/20 text-white" : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-16 bg-white/[0.01] rounded-[4rem] border border-white/5 p-8 md:p-16 min-h-[60vh]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-2">
                  <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white/90 leading-none">
                     {activeTab === "favorites" ? "Yêu Thích" : activePlaylist?.name}
                  </h2>
                  <p className="text-white/30 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                      {filteredItems.length} tác phẩm trong danh sách
                  </p>
                </div>
                
                <div className="h-1 flex-grow bg-white/5 rounded-full mx-8 hidden xl:block">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (filteredItems.length / 10) * 100)}%` }} />
                </div>
            </div>

            {filteredItems.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                  <BookOpen className="w-20 h-20 text-white/5" />
                  <p className="text-white/20 font-black uppercase tracking-[0.4em] text-sm">Danh sách hiện đang trống</p>
                  <Link href="/truyen">
                    <Button variant="secondary" className="px-10 py-6 rounded-2xl border-white/10 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5">Khám Phá Thêm Truyện</Button>
                  </Link>
               </div>
            ) : (
               <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 animate-in slide-in-from-bottom-8 duration-1000">
                  {filteredItems.map((comic: any) => (
                    <div key={comic.comicSlug} className="group flex flex-col gap-5">
                       <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl transition-all duration-700 hover:scale-[1.05] hover:border-primary/40 active:scale-95">
                          <Image src={comic.coverUrl} alt={comic.comicTitle} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" unoptimized />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                          
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20">
                             <button 
                               onClick={(e) => handleRemoveItem(activeTab, comic.comicSlug, e)}
                               className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md text-red-400 border border-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl"
                             >
                                <X size={20} />
                             </button>
                          </div>

                          <Link href={`/truyen/${comic.comicSlug}`} className="absolute inset-0 z-10 flex items-center justify-center">
                             <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-3xl scale-0 group-hover:scale-100 transition-all duration-500 hover:bg-primary-bright">
                                <ChevronRight size={32} className="translate-x-0.5" />
                             </div>
                          </Link>
                       </div>
                       <Link href={`/truyen/${comic.comicSlug}`} className="px-3">
                          <h3 className="text-xl font-black text-white group-hover:text-primary transition-all line-clamp-2 uppercase leading-[0.9] tracking-tighter">
                            {comic.comicTitle}
                          </h3>
                       </Link>
                    </div>
                  ))}
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
