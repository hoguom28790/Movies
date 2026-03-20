"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, Clock } from "lucide-react";
import { getXXHistory, clearXXHistory, XXHistoryEntry } from "@/services/xxDb";
import { Button } from "@/components/ui/Button";

export default function XXHistoryPage() {
  const [history, setHistory] = useState<XXHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getXXHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem phim?")) {
      clearXXHistory();
      setHistory([]);
    }
  };

  const formatProgress = (current: number, duration: number) => {
    if (!duration) return "Đã xem";
    const percent = Math.round((current / duration) * 100);
    return `Đã xem ${percent}%`;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Lịch sử xem phim</h1>
            <p className="text-white/40 text-sm mt-1">Các phim TopXX bạn đã xem gần đây</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <Button 
            variant="secondary" 
            onClick={handleClear}
            className="rounded-xl border-white/10 text-red-400 hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
          <Play className="w-16 h-16 text-white/5 mb-6" />
          <p className="text-white/30 font-bold uppercase tracking-widest">Chưa có lịch sử xem phim</p>
          <Link href="/xx" className="mt-8">
            <Button className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-sm">Khám phá ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {history.map((item) => (
            <Link key={item.movieCode} href={`/xx/movie/${item.movieCode}`} className="group space-y-3">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:border-yellow-500/50 transition-all duration-500">
                <img src={item.posterUrl} alt={item.movieTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Progress Bar */}
                {item.durationSeconds > 0 && (
                   <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ width: `${Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)}%` }} 
                      />
                   </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                      <Play className="w-6 h-6 fill-current ml-1" />
                   </div>
                </div>
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-1 uppercase mb-1">{item.movieTitle}</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                  {formatProgress(item.progressSeconds, item.durationSeconds)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
