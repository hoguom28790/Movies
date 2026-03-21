"use client";

import { useEffect, useState, useRef } from "react";
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

  // Trakt.tv Scrobbling State
  const [traktMatch, setTraktMatch] = useState<any>(null);
  const scrobbleSession = useRef<{ started: boolean; paused: boolean }>({ started: false, paused: false });

  // 1. Content Resolution (Match OPhim Metadata to Trakt ID)
  useEffect(() => {
    const resolveTrakt = async () => {
      if (!user || !movieTitle) return;
      try {
        const { getTraktTokens } = await import("@/services/db");
        const { matchTraktContent } = await import("@/lib/trakt");
        
        const tokens = await getTraktTokens(user.uid);
        if (tokens?.access_token) {
          // Extract Year from title if available (e.g. "Movie (2024)")
          const yearMatch = movieTitle.match(/\((\d{4})\)/);
          const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
          const cleanTitle = movieTitle.replace(/\(\d{4}\)/, "").trim();

          const match = await matchTraktContent(cleanTitle, year);
          if (match) {
            setTraktMatch(match);
            console.log("Trakt Match Found:", match.title);
          }
        }
      } catch (e) {
        console.error("Trakt Resolution Error:", e);
      }
    };
    resolveTrakt();
  }, [user, movieTitle]);

  // Load Playhead History & Sync
  useEffect(() => {
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
        progressSeconds: 0 
      };

      if (history && history.episodeSlug === episodeSlug && history.progressSeconds) {
        const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
        if (iframeRef && iframeRef.contentWindow) {
          iframeRef.contentWindow.postMessage({ type: 'SEEK', time: history.progressSeconds }, '*');
        }
        payload.progressSeconds = history.progressSeconds;
      }
      
      saveHistory(user.uid, payload).catch(console.error);
    };
    
    const timer = setTimeout(attemptSeek, 1000);
    return () => clearTimeout(timer);
  }, [user, movieSlug, episodeSlug]);

  useEffect(() => {
    let lastSaveTime = 0;

    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;

      if (event.data.type === 'ENTER_PSEUDO_FULLSCREEN') setIsPseudoFS(true);
      if (event.data.type === 'EXIT_PSEUDO_FULLSCREEN') setIsPseudoFS(false);

      // Handle Trakt Scrobbling Logic
      const handleTraktScrobble = async (eventType: 'start' | 'pause' | 'stop', progress: number) => {
        if (!user || !traktMatch) return;
        try {
          const { getTraktTokens } = await import("@/services/db");
          const { scrobbleStart, scrobblePause, scrobbleStop } = await import("@/lib/trakt");
          const tokens = await getTraktTokens(user.uid);
          if (!tokens?.access_token) return;

          if (eventType === 'start') {
            await scrobbleStart(tokens.access_token, traktMatch, progress);
            scrobbleSession.current.started = true;
            scrobbleSession.current.paused = false;
          } else if (eventType === 'pause') {
            await scrobblePause(tokens.access_token, traktMatch, progress);
            scrobbleSession.current.paused = true;
          } else if (eventType === 'stop') {
            await scrobbleStop(tokens.access_token, traktMatch, progress);
            scrobbleSession.current.started = false;
          }
        } catch (e) {}
      };

      // Handle continuous progress updates
      if (event.data.type === 'UPDATE_PROGRESS' && user && movieSlug) {
        const currentTime = event.data.time;
        const duration = event.data.duration;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
        const now = Date.now();

        // Trakt Start: Triggers at 1% or when resumed from pause
        if (percent >= 1 && !scrobbleSession.current.started) {
          handleTraktScrobble('start', percent);
        }

        // Periodic Local Save (Firestore)
        if (now - lastSaveTime > 10000) {
          lastSaveTime = now;
          const { saveHistory } = await import("@/services/db");
          saveHistory(user.uid, {
            movieSlug,
            movieTitle: movieTitle || "",
            episodeName: episodeName || "",
            episodeSlug: episodeSlug || "",
            posterUrl: posterUrl || "",
            progressSeconds: currentTime,
            durationSeconds: duration
          }).catch(console.error);
        }

        // Trakt Stop: Triggers at 90% (marked as watched)
        if (percent >= 90 && scrobbleSession.current.started) {
          handleTraktScrobble('stop', percent);
        }
      }

      // Handle Pause/Play for Scrobble
      if (event.data.type === 'VIDEO_PAUSE' && scrobbleSession.current.started) {
        handleTraktScrobble('pause', event.data.percent || 0);
      }
      if (event.data.type === 'VIDEO_PLAY' && scrobbleSession.current.paused) {
        handleTraktScrobble('start', event.data.percent || 0);
      }

      // Handle Video Ended
      if (event.data.type === 'VIDEO_ENDED') {
        if (scrobbleSession.current.started) {
          handleTraktScrobble('stop', 100);
        }

        if (nextEpisodeUrl) {
          router.push(nextEpisodeUrl);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextEpisodeUrl, router, user, movieSlug, episodeSlug, movieTitle, episodeName, posterUrl, traktMatch]);

  useEffect(() => {
    if (isPseudoFS) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isPseudoFS]);

  const isDirectVideo = url.includes('.m3u8') || url.includes('.mp4') || url.includes('.mkv') || url.includes('.ts') || url.includes('m3u8') || url.includes('mp4');

  const iframeSrc = isDirectVideo 
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
