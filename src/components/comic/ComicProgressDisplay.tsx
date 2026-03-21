"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getComicHistory } from "@/services/comicDb";

export function ComicProgressDisplay({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [percent, setPercent] = useState<number>(0);
  const [chapter, setChapter] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getComicHistory(user.uid, slug).then((history) => {
      if (history) {
        setPercent(history.percent || 0);
        setChapter(history.chapterName || "");
      }
    });
  }, [user, slug]);

  if (!percent) return null;

  return (
    <div className="w-full mt-4 bg-white/5 rounded-xl p-3 border border-white/10 animate-in fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Tiến độ đọc: Tập {chapter}</span>
        <span className="text-[11px] font-black text-primary">{Math.round(percent)}%</span>
      </div>
      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
