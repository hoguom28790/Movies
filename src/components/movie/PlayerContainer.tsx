"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDevice } from "@/contexts/DeviceContext";

interface PlayerContainerProps {
  url: string;
  isHls: boolean;
  rawEmbedUrl: string;
  nextEpisodeUrl?: string;
  movieTitle?: string;
  movieSlug?: string;
  episodeName?: string;
  episodeSlug?: string;
  posterUrl?: string;
}

export function PlayerContainer({ url, isHls, rawEmbedUrl, nextEpisodeUrl, movieTitle, movieSlug, episodeName, episodeSlug, posterUrl }: PlayerContainerProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isIOS } = useDevice();
  
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Playhead History
  useEffect(() => {
    let iframeHasLoaded = false;
    
    const attemptSeek = async () => {
      if (!user || !movieSlug || !episodeSlug) return;
      const { getMovieHistory, saveHistory } = await import("@/services/db");
      const history = await getMovieHistory(user.uid, movieSlug);
      
      const payload: any = {
        movieSlug,
        movieTitle: movieTitle || "",
        episodeName: episodeName || "",
        episodeSlug: episodeSlug || "",
        posterUrl: posterUrl || "",
        progressSeconds: 0 // Default to 0 for new episodes
      };

      if (history && history.episodeSlug === episodeSlug && history.progressSeconds) {
        // Same episode -> send SEEK message to iframe
        const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
        if (iframeRef && iframeRef.contentWindow) {
          iframeRef.contentWindow.postMessage({ type: 'SEEK', time: history.progressSeconds }, '*');
        }
        // Keep existing progress internally while bumping updatedAt
        payload.progressSeconds = history.progressSeconds;
      }
      
      // Register movie visit immediately to bump top of history
      saveHistory(user.uid, payload).catch(console.error);
    };
    
    // Slight delay to let iframe spin up
    const timer = setTimeout(attemptSeek, 1000);
    return () => clearTimeout(timer);
  }, [user, movieSlug, episodeSlug]);

  useEffect(() => {
    let lastSaveTime = 0;

    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;

      if (event.data.type === 'ENTER_PSEUDO_FULLSCREEN') {
        setIsPseudoFS(true);
      }
      if (event.data.type === 'EXIT_PSEUDO_FULLSCREEN') {
        setIsPseudoFS(false);
      }

      // Handle continuous progress updates
      if (event.data.type === 'UPDATE_PROGRESS' && user && movieSlug) {
        const currentTime = event.data.time;
        const now = Date.now();
        // Throttle Firestore saves to every 10 seconds
        if (now - lastSaveTime > 10000) {
          lastSaveTime = now;
          const { saveHistory } = await import("@/services/db");
          saveHistory(user.uid, {
            movieSlug,
            movieTitle: movieTitle || "",
            episodeName: episodeName || "",
            episodeSlug: episodeSlug || "",
            posterUrl: posterUrl || "",
            progressSeconds: currentTime
          }).catch(console.error);
        }
      }

      // Handle Video Ended
      if (event.data.type === 'VIDEO_ENDED') {
        
        // Auto Sync to Trakt if connected
        if (user && movieTitle) {
          try {
            const { getTraktTokens } = await import("@/services/db");
            const { pushSingleMovieToTrakt } = await import("@/services/trakt");
            const tokens = await getTraktTokens(user.uid);
            if (tokens && tokens.access_token) {
              await pushSingleMovieToTrakt(tokens.access_token, movieTitle);
            }
          } catch(e) { }
        }

        if (nextEpisodeUrl) {
          router.push(nextEpisodeUrl);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextEpisodeUrl, router, user, movieSlug, episodeSlug, movieTitle, episodeName, posterUrl]);

  useEffect(() => {
    if (isPseudoFS) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isPseudoFS]);

  const iframeSrc = isHls 
    ? `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`
    : rawEmbedUrl || `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`;

  return (
    <div className={isPseudoFS 
      ? (isPortrait 
          ? `fixed top-0 left-full w-[100vh] h-[100vw] rotate-90 origin-top-left z-[9999] bg-black ${isIOS ? 'p-safe' : ''}` 
          : `fixed inset-0 w-screen h-screen z-[9999] bg-black ${isIOS ? 'p-safe' : ''}`)
      : "w-full aspect-video relative shadow-2xl bg-black overflow-hidden"
    }>
      <iframe
        id="main-player"
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0 rounded-[var(--radius)]"
        allowFullScreen
      />
    </div>
  );
}
