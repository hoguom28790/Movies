"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getUserComicFavorites, toggleComicFavorite, ComicFavoriteEntry } from "@/services/comicDb";
import { ComicCard } from "@/components/comic/ComicCard";
import { Heart, Search, BookOpen, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Separate comic favorite page in Hồ Truyện
export default function ComicFavoritePage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ComicFavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await getUserComicFavorites(user.uid);
      setItems(data);
    } catch (err) {
      console.error("Lỗi khi tải yêu thích:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user) loadData();
    else setLoading(false);
  }, [user, authLoading]);

  const handleRemove = async (comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await toggleComicFavorite(user.uid, { comicSlug, comicTitle: "", coverUrl: "" });
      setItems(prev => prev.filter(c => c.comicSlug !== comicSlug));
    } catch(err) { }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-40"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Heart className="w-16 h-16 text-white/10 mx-auto mb-6" />
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-white/40 font-bold mb-8">Vui lòng đăng nhập để xem danh sách truyện yêu thích.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-[14px]">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  const filteredItems = items.filter(c => 
    c.comicTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-16 mt-12 animate-in fade-in duration-1000 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 border-b border-indigo-500/10 pb-8">
        <div className="space-y-4">
           <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.8] select-none">Tủ Yêu Thích</h1>
           <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-primary/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                 {filteredItems.length} TRUYỆN
              </span>
           </div>
        </div>

        <div className="relative group max-w-sm w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
           <input 
             type="text"
             placeholder="Tìm kiếm truyện yêu thích..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
           />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 space-y-6">
           <BookOpen className="w-12 h-12 text-white/5" />
           <div className="space-y-1">
              <p className="text-white/20 font-black uppercase tracking-[0.2em] text-sm italic">Bạn chưa nhấn Thích truyện nào cả</p>
           </div>
           <Link href="/truyen">
             <Button className="px-10 py-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary-hover transition-all shadow-xl shadow-indigo-500/20">Khám Phá Truyện Ngay</Button>
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 animate-in slide-in-from-bottom-4 duration-1000">
           {filteredItems.map(comic => (
             <div key={comic.comicSlug} className="group relative pt-4">
                <ComicCard title={comic.comicTitle} slug={comic.comicSlug} posterUrl={comic.coverUrl} />
                <button 
                  onClick={(e) => handleRemove(comic.comicSlug, e)}
                  className="delete-btn-premium"
                  title="Xóa khỏi yêu thích"
                >
                   <X className="w-5 h-5" />
                </button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
