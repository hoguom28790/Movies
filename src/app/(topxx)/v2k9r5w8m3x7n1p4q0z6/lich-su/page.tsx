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
          <Link href="/v2k9r5w8m3x7n1p4q0z6" className="mt-10">
            <Button className="rounded-[20px] px-10 h-14 font-black uppercase tracking-widest text-xs shadow-2xl shadow-yellow-500/20">Khám phá ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {history.map((item) => (
            <XXMovieCard 
              key={item.movieCode}
              title={item.movieTitle}
              slug={item.movieCode}
              posterUrl={item.posterUrl}
              progress={item.durationSeconds > 0 ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100)) : (item.progressSeconds > 0 ? 50 : 0)}
              onDelete={(e) => handleRemoveItem(item.movieCode, e)}
            />
          ))}
        </div>
      )}
    </div>

  );
}
