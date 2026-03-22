"use client";

import { useEffect, useState, useRef } from "react";
import { useStylePreset } from "@/contexts/StylePresetContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCombinedSkipTimes, SkipTime } from "@/services/skipService";
import { getUserSettings, saveUserSettings } from "@/services/db";
import { motion, AnimatePresence } from "framer-motion";

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
  const { preset: stylePreset } = useStylePreset();
  const router = useRouter();
  const { user } = useAuth();
  const { isIOS } = useDevice();
  const queryClient = useQueryClient();
  
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [skipShow, setSkipShow] = useState<SkipTime | null>(null);
  const [isAnime, setIsAnime] = useState(false);
  const [malId, setMalId] = useState<number | null>(null);
  const [toast, setToast] = useState<React.ReactNode | null>(null);
  const lastProcessedSkip = useRef<number | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Detect if anime from title or genres
    if (movieTitle?.toLowerCase().includes("anime") || movieTitle?.toLowerCase().includes("hoạt hình")) {
      setIsAnime(true);
    }
  }, [movieTitle]);

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

            // If Anime, resolve MAL ID using Malsync API
            if (isAnime && match.ids?.tmdb) {
              fetch(`https://api.malsync.moe/mal/anime/tmdb/${match.ids.tmdb}`)
                .then(r => r.json())
                .then(data => {
                  if (data?.id) setMalId(data.id);
                })
                .catch(() => {});
            }
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
        const time = event.data.time;
        setCurrentTime(time);
        const duration = event.data.duration;
        const percent = duration > 0 ? (time / duration) * 100 : 0;
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

  // --- Skip Intro Data Fetching ---
  const seasonNum = 1; // Default
  const episodeNum = parseInt(episodeSlug?.replace(/\D/g, "") || "1");

  const { data: skipTimes } = useQuery({
    queryKey: ["skip-intro", traktMatch?.ids?.tmdb, malId, episodeNum],
    queryFn: async () => {
      return getCombinedSkipTimes({
        tmdbId: traktMatch?.ids?.tmdb,
        malId: malId || undefined,
        season: seasonNum,
        episode: episodeNum,
        isAnime
      });
    },
    enabled: !!traktMatch?.ids?.tmdb,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 1 day
  });

  const { data: userSettings } = useQuery({
    queryKey: ["user-settings", user?.uid],
    queryFn: () => (user ? getUserSettings(user.uid) : null),
    enabled: !!user,
  });

  const autoSkipMutation = useMutation({
    mutationFn: (autoSkip: boolean) => 
      user ? saveUserSettings(user.uid, { autoSkipIntro: autoSkip }) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings", user?.uid] });
    }
  });

  // --- Skip Logic & Auto-skip ---
  useEffect(() => {
    if (!skipTimes || skipTimes.length === 0) return;
    
    const currentSkip = skipTimes.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    
    if (currentSkip) {
      if (lastProcessedSkip.current === currentSkip.startTime) return;
      lastProcessedSkip.current = currentSkip.startTime;

      if (userSettings?.autoSkipIntro) {
        handleSeek(currentSkip.endTime + 0.5);
        setToast(
          <div className="flex items-center gap-3">
            <span>Đã tự động bỏ qua mở đầu ⏩</span>
            <button 
              onClick={handleDisableAutoSkip}
              className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-black uppercase hover:bg-primary-hover transition-colors shadow-lg"
            >
              Tắt tự động
            </button>
          </div>
        );
      } else {
        setSkipShow(currentSkip);
      }
    } else {
      lastProcessedSkip.current = null;
      setSkipShow(null);
    }
  }, [currentTime, skipTimes, userSettings?.autoSkipIntro]);

  const handleSeek = (time: number) => {
    const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
    if (iframeRef && iframeRef.contentWindow) {
      iframeRef.contentWindow.postMessage({ type: 'SEEK', time }, '*');
      setSkipShow(null);
      if (!userSettings?.autoSkipIntro) {
        setToast("Đã bỏ qua phần mở đầu ⏩");
      }
    }
  };

  const handleDisableAutoSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    autoSkipMutation.mutate(false);
    setToast("Đã tắt tự động bỏ qua 🛑");
  };

  // Keyboard Shortcut 'S' listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && skipShow) {
        handleSeek(skipShow.endTime + 0.5);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [skipShow]);

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
    ? `/player.html?url=${encodeURIComponent(url)}&theme=${stylePreset}`
    : rawEmbedUrl || `/player.html?url=${encodeURIComponent(url)}&theme=${stylePreset}`;

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

      {/* Skip Intro Overlay */}
      <AnimatePresence>
        {skipShow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-6 z-[100] flex flex-col gap-2 pointer-events-auto"
          >
            <Button
              onClick={() => handleSeek(skipShow.endTime + 0.5)}
              className="bg-primary/90 backdrop-blur-md text-white border border-primary/20 shadow-2xl px-6 py-6 h-12 gap-3 hover:scale-105 transition-all text-sm font-bold tracking-wide uppercase"
            >
              <SkipForward className="w-5 h-5 fill-current" />
              Bỏ qua phần mở đầu
            </Button>
            
            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!userSettings?.autoSkipIntro}
                  onChange={(e) => autoSkipMutation.mutate(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-[11px] font-bold text-white/50 group-hover:text-white transition-colors uppercase tracking-widest">Tự động bỏ qua</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 text-white text-[13px] font-bold shadow-2xl flex items-center gap-3 whitespace-nowrap pointer-events-auto"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
