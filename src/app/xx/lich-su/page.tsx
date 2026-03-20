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

  const handleRemoveItem = (movieCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = getXXHistory();
    const updated = current.filter(item => item.movieCode !== movieCode);
    localStorage.setItem("topxx_history", JSON.stringify(updated));
    setHistory(updated);
  };

  const formatProgress = (current: number, duration: number) => {
    if (!duration) return "Đã xem";
    const percent = Math.round((current / duration) * 100);
    return `Đã xem ${percent}%`;
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[24px] bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-2xl">
            <Clock className="w-8 h-8 text-yellow-500 shadow-yellow-500/50" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none select-none">Lịch sử xem</h1>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em] italic">Dấu chân điện ảnh của bạn trên TopXX</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <Button 
            variant="secondary" 
            onClick={handleClear}
            className="rounded-[20px] border-white/5 h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-white/[0.03] hover:bg-red-500 hover:text-white transition-all shadow-2xl"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả lịch sử
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 animate-in fade-in duration-1000">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8">
             <Play className="w-10 h-10 text-white/10" />
          </div>
          <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">Ký ức điện ảnh đang chờ bạn...</p>
          <Link href="/xx" className="mt-10">
            <Button className="rounded-[20px] px-10 h-14 font-black uppercase tracking-widest text-xs shadow-2xl shadow-yellow-500/20">Khám phá ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
          {history.map((item) => (
            <div key={item.movieCode} className="group space-y-4">
              <div className="relative aspect-[2/3] rounded-[30px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-yellow-500/30 group-hover:-translate-y-3">
                <img src={item.posterUrl} alt={item.movieTitle} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Individual Remove Button */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <button 
                      onClick={(e) => handleRemoveItem(item.movieCode, e)}
                      className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-xl text-red-500 border border-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                {item.durationSeconds > 0 && (
                   <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-md">
                      <div 
                        className="h-full bg-yellow-500 shadow-lg shadow-yellow-500/50 transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)}%` }} 
                      />
                   </div>
                )}

                <Link href={`/xx/movie/${item.movieCode}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                   <div className="w-16 h-16 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                      <Play className="w-8 h-8 fill-current ml-1" />
                   </div>
                </Link>
              </div>
              <div className="px-1 space-y-1.5">
                <Link href={`/xx/movie/${item.movieCode}`}>
                    <h3 className="text-sm font-black text-white group-hover:text-yellow-500 transition-colors line-clamp-1 uppercase italic tracking-tighter leading-tight">{item.movieTitle}</h3>
                </Link>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                  {formatProgress(item.progressSeconds, item.durationSeconds)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
