"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserComicHistory, ComicHistoryEntry } from "@/services/comicDb";
import { Play } from "lucide-react";

interface ComicContinueBtnProps {
  slug: string;
  activeSource: string;
}

export function ComicContinueBtn({ slug, activeSource }: ComicContinueBtnProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ComicHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const hist = await getUserComicHistory(user.uid);
        const item = hist.find(h => h.comicSlug === slug);
        if (item) setHistory(item);
      } catch (err) {
        console.error("Failed to fetch comic history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, slug]);

  if (loading || !history) return null;

  return (
    <Link 
      href={`/doc/${slug}/${history.chapterName}?source=${activeSource}`}
      className="flex-1 sm:flex-none px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] transition-all text-center flex items-center justify-center gap-2"
    >
      <Play className="w-4 h-4 fill-current" />
      Đọc Tiếp: Ch. {history.chapterName}
    </Link>
  );
}
