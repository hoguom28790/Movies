"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

interface MoviePlaySectionProps {
  slug: string;
  source: string;
  firstEp: { slug: string; name: string } | null;
  movieTitle: string;
  year?: string;
  type?: "movie" | "show";
}

export function MoviePlaySection({ slug, source, firstEp, movieTitle, year, type = "movie" }: MoviePlaySectionProps) {
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { getTraktTokens } = await import("@/services/db");
        const { matchTraktContent, checkWatchedStatus } = await import("@/lib/trakt");
        
        const tokens = await getTraktTokens(user.uid);
        if (tokens?.access_token) {
          const cleanTitle = movieTitle.replace(/\(\d{4}\)/, "").trim();
          const match = await matchTraktContent(cleanTitle, parseInt(year || "0"), type === "show" ? "show" : "movie");
          
          if (match && match.ids) {
            const watched = await checkWatchedStatus(tokens.access_token, type === "show" ? "show" : "movie", match.ids);
            setIsWatched(watched);
          }
        }
      } catch (e) {
        console.error("Watched status check failed", e);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, movieTitle, year, type]);

  if (!firstEp) {
    return (
      <Button disabled className="w-full h-14 rounded-2xl bg-white/5 text-white/30 border border-white/5">
        Phim Sắp Chiếu
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <Link href={`/xem/${slug}`} className="w-full group">
        <Button className="w-full h-16 rounded-3xl gap-4 font-black text-lg bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 relative overflow-hidden z-20 group-hover:scale-[1.02] active:scale-[0.98]">
          <Play className="w-7 h-7 fill-current" />
          {isWatched ? "ĐÃ XEM (TRAY)" : "XEM PHIM (PRO)"}
          
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </Link>
      
      {isWatched && (
        <div className="flex items-center justify-center gap-2 text-[11px] font-black text-green-500 uppercase italic tracking-widest bg-green-500/5 py-2 rounded-xl border border-green-500/10">
          <CheckCircle className="w-4 h-4" />
          Đã đồng bộ với Trakt (TRAY)
        </div>
      )}
    </div>
  );
}
