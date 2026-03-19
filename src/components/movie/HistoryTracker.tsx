"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveHistory } from "@/services/db";
import { useAuth } from "@/contexts/AuthContext";

interface HistoryTrackerProps {
  movieSlug: string;
  movieTitle: string;
  episodeName: string;
  episodeSlug: string;
  posterUrl: string;
}

export function HistoryTracker({ movieSlug, movieTitle, episodeName, episodeSlug, posterUrl }: HistoryTrackerProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      saveHistory(user.uid, {
        movieSlug,
        movieTitle,
        episodeName,
        episodeSlug,
        posterUrl,
        progressSeconds: 0
      }).catch(console.error);
    }

  }, [user, movieSlug, episodeSlug]);
  
  return null;
}
