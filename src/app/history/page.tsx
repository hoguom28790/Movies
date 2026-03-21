"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserHistory, deleteFromHistory } from "@/services/db";
import { getUserComicHistory, removeComicHistoryItem, ComicHistoryEntry } from "@/services/comicDb";
import { HistoryEntry } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { ComicCard } from "@/components/comic/ComicCard";
import { X, Film, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"movies" | "comics">("movies");
  
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [comicItems, setComicItems] = useState<ComicHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await deleteFromHistory(user.uid, movieSlug);
      setItems(prev => prev.filter(item => item.movieSlug !== movieSlug));
    } catch (err) {
      console.error("Lỗi khi xóa phim:", err);
      alert("Đã xảy ra lỗi khi xóa phim.");
    }
  };

  const handleDeleteComic = async (comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await removeComicHistoryItem(user.uid, comicSlug);
      setComicItems(prev => prev.filter(item => item.comicSlug !== comicSlug));
    } catch (err) {
      console.error("Lỗi khi xóa truyện:", err);
      alert("Đã xảy ra lỗi khi xóa truyện.");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      getUserHistory(user.uid).then(setItems).catch(() => setItems([])),
      getUserComicHistory(user.uid).then(setComicItems).catch(() => setComicItems([]))
    ]).finally(() => setLoading(false));

  }, [user, authLoading]);

  if (authLoading || loading) return <div className="p-8 text-center text-neutral-400 mt-24">Đang tải dữ liệu...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center mt-24 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-neutral-400 mb-8">Vui lòng đăng nhập để xem lịch sử của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-3 rounded-2xl font-bold">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-3xl font-bold border-l-4 border-primary pl-3 flex whitespace-nowrap">Lịch Sử Của Bạn</h1>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl shrink-0 w-fit">
          <button 
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "movies" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Film className="w-4 h-4" /> Phim
          </button>
          <button 
            onClick={() => setActiveTab("comics")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "comics" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Truyện
          </button>
        </div>
      </div>
      
      {activeTab === "movies" && (
        items.length === 0 ? (
          <p className="text-neutral-400 bg-white/5 p-8 rounded-2xl text-center border border-white/10">Bạn chưa xem bộ phim nào gần đây.</p>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {items.map(item => (
              <div key={item.id} className="relative group">
                <MovieCard 
                  title={item.movieTitle}
                  slug={item.movieSlug}
                  posterUrl={item.posterUrl}
                />
                <div className="absolute bottom-12 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md border border-white/10 pointer-events-none z-10 shadow-lg">
                  Tập {item.episodeName}
                </div>
                {item.progressSeconds > 0 && (
                   <div className="absolute bottom-16 left-2 right-2 h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none z-10 shadow-lg">
                     {/* Phim không lưu duration rõ ràng nên progress chỉ ước chừng hoặc không vẽ */}
                     <div className="h-full bg-primary" style={{ width: '50%' }} />
                   </div>
                )}
                <button 
                  onClick={(e) => handleDelete(item.movieSlug, e)}
                  className="absolute -top-3 -left-3 z-20 bg-black/60 hover:bg-red-500 backdrop-blur-xl text-white rounded-full p-2 transition-all shadow-lg hover:scale-110 border border-white/20"
                  title="Xóa khỏi lịch sử"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === "comics" && (
        comicItems.length === 0 ? (
          <p className="text-neutral-400 bg-white/5 p-8 rounded-2xl text-center border border-white/10">Bạn chưa đọc bộ truyện nào gần đây.</p>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {comicItems.map(item => (
              <div key={item.id} className="relative group flex flex-col">
                <ComicCard 
                  title={item.comicTitle}
                  slug={item.comicSlug}
                  posterUrl={item.coverUrl}
                  latestChapter={`Đang dọc: Ch. ${item.chapterName}`}
                />
                
                {/* Comic Progress Bar */}
                <div className="w-full mt-3 px-1">
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Tiến độ</span>
                      <span className="text-[10px] font-bold text-primary">{item.percent}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${item.percent}%` }} />
                   </div>
                </div>

                <button 
                  onClick={(e) => handleDeleteComic(item.comicSlug, e)}
                  className="absolute -top-3 -left-3 z-20 bg-black/60 hover:bg-red-500 backdrop-blur-xl text-white rounded-full p-2 transition-all shadow-lg hover:scale-110 border border-white/20"
                  title="Xóa khỏi lịch sử"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
