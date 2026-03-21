"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Trash2, Clock, X } from "lucide-react";
import { getXXHistory, clearXXHistory, XXHistoryEntry, removeXXHistoryItem } from "@/services/topxxDb";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getXXFirestoreHistory, 
  deleteXXFirestoreHistoryItem 
} from "@/services/topxxFirestore";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

import { XXMovieCard } from "@/components/movie/XXMovieCard";
import { Button } from "@/components/ui/Button";

export default function XXHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<XXHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (user) {
          const cloudHistory = await getXXFirestoreHistory(user.uid);
          setHistory(cloudHistory);
        } else {
          setHistory(getXXHistory());
        }
      } catch (err) {
        setHistory(getXXHistory());
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleClear = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem phim?")) {
      if (user) {
        try {
          // Clear Firestore (Query and delete each for TopXX)
          const q = query(collection(db, "xx_history"), where("userId", "==", user.uid));
          const snap = await getDocs(q);
          const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
        } catch (err) {
          console.error("Firestore clear error:", err);
        }
      }
      clearXXHistory();
      setHistory([]);
    }
  };

  const handleRemoveItem = async (movieCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      await deleteXXFirestoreHistoryItem(user.uid, movieCode).catch(console.error);
    }
    removeXXHistoryItem(movieCode);
    
    // Refresh list
    if (user) {
       setHistory(prev => prev.filter(h => h.movieCode !== movieCode));
    } else {
       setHistory(getXXHistory());
    }
  };

  const formatProgress = (current: number, duration: number) => {
    if (!duration) return "ĐÃ XEM";
    const percent = Math.round((current / duration) * 100);
    return `ĐÃ XEM ${percent}%`;
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
            <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 animate-in fade-in duration-1000">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8">
             <Play className="w-10 h-10 text-white/10" />
          </div>
          <p className="text-white/20 font-black uppercase tracking-[0.3em] italic">Ký ức điện ảnh đang chờ bạn...</p>
          <Link href="/topxx" className="mt-10">
            <Button className="rounded-[20px] px-10 h-14 font-black uppercase tracking-widest text-xs shadow-2xl shadow-yellow-500/20">Khám phá ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {history.map((item) => (
            <div key={item.movieCode} className="relative group">
              <XXMovieCard 
                title={item.movieTitle}
                slug={item.movieCode}
                posterUrl={item.posterUrl}
              />
              
              {/* Progress Bar Over Card */}
              {item.durationSeconds > 0 && (
                 <div className="absolute top-[calc(66.6%)] left-0 right-0 h-1 bg-white/10 backdrop-blur-md z-10 mx-3 pointer-events-none rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)}%` }} 
                    />
                 </div>
              )}

              {/* Individual Remove Button - Always visible on mobile, slightly smaller */}
              <button 
                onClick={(e) => handleRemoveItem(item.movieCode, e)}
                className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl text-white border border-white/10 flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all shadow-xl group-hover:opacity-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Xóa khỏi lịch sử"
              >
                 <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-[24.5%] left-3 right-3 pointer-events-none z-10 flex justify-between items-center">
                 <div className="bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-2 py-0.5 rounded-lg border border-white/5 uppercase italic tracking-widest">
                    {formatProgress(item.progressSeconds, item.durationSeconds)}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
