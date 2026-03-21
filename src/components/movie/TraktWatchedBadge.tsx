"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle } from "lucide-react";

interface TraktWatchedBadgeProps {
  movieTitle: string;
  year?: number;
  type?: "movie" | "show";
}

export function TraktWatchedBadge({ movieTitle, year, type = "movie" }: TraktWatchedBadgeProps) {
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const { getTraktTokens } = await import("@/services/db");
        const { matchTraktContent, checkWatchedStatus } = await import("@/lib/trakt");
        
        const tokens = await getTraktTokens(user.uid);
        if (tokens?.access_token) {
          // Clean title
          const cleanTitle = movieTitle.replace(/\(\d{4}\)/, "").trim();
          const match = await matchTraktContent(cleanTitle, year, type);
          
          if (match && match.ids) {
            const watched = await checkWatchedStatus(tokens.access_token, type, match.ids);
            setIsWatched(watched);
          }
        }
      } catch (e) {}
    };

    checkStatus();
  }, [user, movieTitle, year, type]);

  if (!isWatched) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500">
      <CheckCircle className="w-3 h-3" />
      Đã Xem (Trakt)
    </div>
  );
}
