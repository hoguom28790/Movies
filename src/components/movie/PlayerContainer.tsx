"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface PlayerContainerProps {
  url: string;
  isHls: boolean;
  rawEmbedUrl: string;
  nextEpisodeUrl?: string;
  movieTitle?: string;
}

export function PlayerContainer({ url, isHls, rawEmbedUrl, nextEpisodeUrl, movieTitle }: PlayerContainerProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data === 'object' && event.data?.type === 'VIDEO_ENDED') {
        
        // Auto Sync to Trakt if connected
        if (user && movieTitle) {
          try {
            const { getTraktTokens } = await import("@/services/db");
            const { pushSingleMovieToTrakt } = await import("@/services/trakt");
            const tokens = await getTraktTokens(user.uid);
            if (tokens && tokens.access_token) {
              await pushSingleMovieToTrakt(tokens.access_token, movieTitle);
              console.log("Scrobbled to Trakt:", movieTitle);
            }
          } catch(e) { console.error("Trakt scrobble failed"); }
        }

        if (nextEpisodeUrl) {
          router.push(nextEpisodeUrl);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextEpisodeUrl, router, user, movieTitle]);

  const iframeSrc = isHls 
    ? `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`
    : rawEmbedUrl || `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`;

  return (
    <div className="w-full aspect-video bg-black relative shadow-2xl">
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0 rounded-[var(--radius)]"
        allowFullScreen
      />
    </div>
  );
}
