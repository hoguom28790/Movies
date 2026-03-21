"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserComicHistory, removeComicHistoryItem, ComicHistoryEntry } from "@/services/comicDb";
import { ComicCard } from "@/components/comic/ComicCard";
import { X, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Separate comic history page in Hồ Truyện
export default function ComicHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ComicHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (comicSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await removeComicHistoryItem(user.uid, comicSlug);
      setItems(prev => prev.filter(item => item.comicSlug !== comicSlug));
    } catch (err) {
      console.error("Lỗi khi xóa truyện:", err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    getUserComicHistory(user.uid)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  }, [user, authLoading]);

  if (authLoading || loading) return <div className="p-8 text-center text-neutral-400 mt-24">Đang tải lịch sử đọc truyện...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center mt-12 flex flex-col items-center">
        <BookOpen className="w-16 h-16 text-white/10 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-neutral-400 mb-8">Vui lòng đăng nhập để xem lịch sử đọc truyện của bạn.</p>
        <Button onClick={() => window.location.href='/login'} className="px-8 py-3 rounded-2xl font-bold">Đăng Nhập Ngay</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase border-l-4 border-indigo-500 pl-4">Lịch Sử Đọc Truyện</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">{items.length} Truyện</span>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[30px] flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-white/5 mb-4" />
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Bạn chưa đọc bộ truyện nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-in fade-in duration-700">
          {items.map(item => (
            <div key={item.id} className="relative group flex flex-col">
              <ComicCard 
                title={item.comicTitle}
                slug={item.comicSlug}
                posterUrl={item.coverUrl}
                latestChapter={`Đã đọc: Ch. ${item.chapterName}`}
              />
              
              {/* Comic Progress Bar */}
              <div className="w-full mt-3 px-1">
                 <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Tiến độ</span>
                    <span className="text-[10px] font-bold text-indigo-400">{item.percent}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 transition-all rounded-full" style={{ width: `${item.percent}%` }} />
                 </div>
              </div>

              <button 
                onClick={(e) => handleDelete(item.comicSlug, e)}
                className="absolute -top-3 -left-3 z-20 bg-black/60 hover:bg-red-500 backdrop-blur-xl text-white rounded-full p-2 transition-all shadow-lg hover:scale-110 border border-white/20 opacity-0 group-hover:opacity-100"
                title="Xóa khỏi lịch sử"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
