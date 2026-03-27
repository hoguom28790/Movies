// FORCED TopXX to use internal player only + proxy topxx.vip & avdbapi.com + progress saving working
"use client";

import { useEffect, useState, useRef } from "react";
import { useStylePreset } from "@/contexts/StylePresetContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkipForward, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCombinedSkipTimes, SkipTime } from "@/services/skipService";
import { getUserSettings, saveUserSettings } from "@/services/db";
import { motion, AnimatePresence } from "framer-motion";
import { getMovieSource, getPosterUrl } from "@/lib/movie-utils";

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
  source?: string;
}

export function PlayerContainer({ url, isHls, rawEmbedUrl, nextEpisodeUrl, movieTitle, movieSlug, episodeName, episodeSlug, posterUrl, source }: PlayerContainerProps) {
  const { preset: stylePreset } = useStylePreset();
  const router = useRouter();
  const { user } = useAuth();
  const { isIOS } = useDevice();
  const queryClient = useQueryClient();
  
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [seekAttempted, setSeekAttempted] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isUrlEmbed, setIsUrlEmbed] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [skipShow, setSkipShow] = useState<SkipTime | null>(null);
  const [isAnime, setIsAnime] = useState(false);
  const [malId, setMalId] = useState<number | null>(null);
  const [toast, setToast] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastProcessedSkip = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(Date.now());

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

  // MOUNT: We no longer save history on mount to avoid overwriting existing progress before resume
  /*
  useEffect(() => {
    ...
  }, [user, movieSlug, episodeSlug, episodeName, posterUrl]);
  */

  useEffect(() => {
    setIsLoading(true);
    setPlayerReady(false);
    setSeekAttempted(false);
    const timer = setTimeout(() => setIsLoading(false), 2000); 
    return () => clearTimeout(timer);
  }, [url]);

  // Resolve URL for TopXX/AVDB
  useEffect(() => {
    const resolve = async () => {
      const targetUrl = url || rawEmbedUrl || "";
      const isTopXX = getMovieSource(movieSlug || "", source) === 'topxx' || getMovieSource(movieSlug || "", source) === 'avdb';
      
      if (isTopXX && targetUrl && !targetUrl.includes('.m3u8')) {
        console.log(`[TopXX] Resolving stream for: ${targetUrl}`);
        try {
          const res = await fetch(`/api/topxx/resolve?url=${encodeURIComponent(targetUrl)}`);
          if (!res.ok) throw new Error("Resolution failed");
          const data = await res.json();
          console.log(`[TopXX] Resolved URL: ${data.url} (Type: ${data.type})`);
          setResolvedUrl(data.url);
          setIsUrlEmbed(data.type === 'embed');
        } catch (e) {
          console.error("[TopXX] Stream resolution failed:", e);
          setResolvedUrl(targetUrl);
          setIsUrlEmbed(true);
        }
      } else {
        setResolvedUrl(targetUrl);
        setIsUrlEmbed(targetUrl ? (!targetUrl.includes('.m3u8') && !targetUrl.includes('.mp4')) : false);
      }
    };
    resolve();
  }, [url, rawEmbedUrl, source]);

  // Sync with Firebase History  // EXCLUSIVE MOUNT-SYNC FOR TOPXX/AVDB (Embeds don't send handshake)
  useEffect(() => {
    if (!user || !movieSlug) return;
    
    const MOUNT_SAVE_DELAY = 1500;
    const detectedSource = getMovieSource(movieSlug, source);
    const isTopXX = detectedSource === 'topxx' || detectedSource === 'avdb';

    if (isTopXX) {
       const timer = setTimeout(async () => {
         const { getMovieHistory, saveHistory } = await import("@/services/db");
         const absolutePoster = getPosterUrl(posterUrl, detectedSource);
         
         try {
           const existing = await getMovieHistory(user.uid, movieSlug, detectedSource);
           // We only save if no history exists or it was just started (0s)
           if (!existing || existing.progressSeconds === 0) {
              await saveHistory(user.uid, {
                movieSlug,
                movieTitle: movieTitle || "",
                episodeName: episodeName || "Full",
                episodeSlug: episodeSlug || "full",
                posterUrl: absolutePoster,
                progressSeconds: 0,
                durationSeconds: 0,
                progress: 0,
                source: detectedSource
              });
              console.log(`[TopXX] MOUNT-SYNC to Firebase for: ${movieSlug}`);
           }
         } catch(e) {}

         // LocalStorage Always
         try {
            const { saveXXHistory } = await import("@/services/topxxDb");
            saveXXHistory({
              movieCode: movieSlug,
              movieTitle: movieTitle || "",
              posterUrl: absolutePoster,
              progressSeconds: 0,
              durationSeconds: 0,
            });
         } catch(e) {}

       }, MOUNT_SAVE_DELAY);
       return () => clearTimeout(timer);
    }
  }, [user, movieSlug, source, movieTitle, episodeName, episodeSlug, posterUrl]);

  // Sync with Firebase History for Seeking via Handshake
  useEffect(() => {
    if (!user || !movieSlug || !episodeSlug || !playerReady || seekAttempted) return;

    let pingInterval: NodeJS.Timeout;
    const handleHandshake = async (event: MessageEvent) => {
      if (typeof event.data === 'object' && event.data.type === 'HANDSHAKE_PONG') {
        console.log("HANDSHAKE PONG received. Sending SEEK...");
        clearInterval(pingInterval);
        const { getMovieHistory } = await import("@/services/db");
        const detectedSource = getMovieSource(movieSlug, source);
        const isTopXX = detectedSource === 'topxx' || detectedSource === 'avdb';
        
        const history = await getMovieHistory(user.uid, movieSlug, detectedSource);
        console.log(`[RESUME DEBUG] source: ${source} history_found: ${!!history} history_ep: ${history?.episodeSlug} current_ep: ${episodeSlug}`);
        
        const isSameEpisode = isTopXX || !episodeSlug || history?.episodeSlug === episodeSlug;

        if (history && isSameEpisode && history.progressSeconds) {
          const lastPosition = history.progressSeconds;
          console.log("[RESUME] Applying seek to:", lastPosition);
          const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
          if (iframeRef && iframeRef.contentWindow) {
             iframeRef.contentWindow.postMessage({ type: 'SEEK', time: lastPosition }, '*');
          }
        }
        setSeekAttempted(true);
      }
    };

    window.addEventListener('message', handleHandshake);
    
    pingInterval = setInterval(() => {
      const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
      if (iframeRef && iframeRef.contentWindow) {
        console.log("Sending HANDSHAKE PING...");
        iframeRef.contentWindow.postMessage({ type: 'HANDSHAKE_PING' }, '*');
      }
    }, 1000);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('message', handleHandshake);
    };
  }, [user, movieSlug, episodeSlug, playerReady, seekAttempted]);

  useEffect(() => {
    let lastSaveTime = 0;

    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;

      if (event.data.type === 'PLAYER_READY') {
        setPlayerReady(true);
      }

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

        // Periodic Local Save (Firestore) - Only if not at 0:00
        const canSave = (now - lastSaveTimeRef.current > 15000) && (time > 0);
        if (canSave) {
          lastSaveTimeRef.current = now;
          console.log(`[TopXX] Progress Update for ${movieSlug}: ${time.toFixed(2)}s / ${duration.toFixed(2)}s`);
          
          const { saveHistory } = await import("@/services/db");
          const detectedSource = getMovieSource(movieSlug, source);
          const absolutePoster = getPosterUrl(posterUrl, detectedSource);

          try {
            await saveHistory(user.uid, {
              movieSlug,
              movieTitle: movieTitle || "",
              episodeName: episodeName || "Full",
              episodeSlug: episodeSlug || "full",
              posterUrl: absolutePoster,
              progressSeconds: Math.floor(time),
              durationSeconds: Math.floor(duration),
              progress: Math.round(percent),
              source: detectedSource
            });
            console.log(`[TopXX] Successfully saved position to Firebase (${detectedSource})`);
          } catch (err) {
            console.error("[TopXX] History save failed:", err);
          }

          const isTopXX = detectedSource === 'topxx' || detectedSource === 'avdb';
          if (isTopXX) {
            const { saveXXHistory } = await import("@/services/topxxDb");
            saveXXHistory({
              movieCode: movieSlug,
              movieTitle: movieTitle || "",
              posterUrl: absolutePoster,
              progressSeconds: time,
              durationSeconds: duration
            });
          }
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
    return () => {
      window.removeEventListener('message', handleMessage);
    };
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
    if (!playerReady || !skipTimes || skipTimes.length === 0) return;
    const iframeRef = document.getElementById('main-player') as HTMLIFrameElement;
    if (iframeRef && iframeRef.contentWindow) {
      iframeRef.contentWindow.postMessage({ type: 'SKIP_TIMES', times: skipTimes }, '*');
    }
  }, [playerReady, skipTimes]);

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

  const iframeSrc = `/player.html?url=${encodeURIComponent(resolvedUrl || "")}&theme=${stylePreset}&isEmbed=${isUrlEmbed}&v=3.0`;

  return (
    <div 
      className={isPseudoFS 
        ? (isPortrait 
            ? `fixed top-0 left-full w-[100vh] h-[100vw] rotate-90 origin-top-left z-[9999] bg-black ${isIOS ? 'p-safe' : ''}` 
            : `fixed inset-0 w-screen h-screen z-[9999] bg-black ${isIOS ? 'p-safe' : ''}`)
        // FIXED player empty space below - set proper aspect-ratio and container height
        : "w-full aspect-video h-auto min-h-[180px] self-start relative shadow-cinematic-2xl bg-black overflow-hidden rounded-[32px] border border-white/5"
      } 
      style={!isPseudoFS ? { aspectRatio: '16/9' } : {}}
    >
      {resolvedUrl ? (
        <iframe
          id="main-player"
          key={iframeSrc}
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0 rounded-[28px]"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsLoading(false)}
        />
      ) : !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white/40 gap-4">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <X className="w-8 h-8" />
           </div>
           <p className="text-sm font-black uppercase tracking-widest italic">Nguồn phim không phản hồi</p>
           <p className="text-[10px] opacity-50 px-12 text-center">Vui lòng chọn server khác hoặc thử lại sau ít phút (ErrorCode: NULL_STREAM)</p>
        </div>
      )}

      {/* FIXED: Source Switch Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-white text-base font-black uppercase italic tracking-[0.2em] animate-pulse">Switching Cinema Protocol</p>
              <p className="text-white/30 text-[10px] font-black uppercase italic tracking-[0.1em]">Optimizing HLS buffers for {movieTitle}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Intro Overlay - Premium Cinematic */}
      <AnimatePresence>
        {skipShow && (
          <motion.div
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            className={`absolute bottom-24 right-8 z-[100] flex flex-col gap-4 pointer-events-auto`}
          >
            <motion.div 
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
               className="relative group"
            >
              {/* Pulse Glow Effect */}
              <div className="absolute inset-0 bg-[#ef4444] blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity rounded-2xl" />
              
              <Button
                onClick={() => handleSeek(skipShow.endTime + 0.5)}
                className="relative glass-pro bg-black/40 text-white border border-white/10 shadow-cinematic-xl px-7 py-4 h-auto gap-4 hover:bg-[#ef4444] hover:border-[#ef4444] transition-all text-[13px] font-black uppercase tracking-[0.2em] italic rounded-2xl group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              >
                <SkipForward className="w-5 h-5 fill-current animate-pulse" />
                Bỏ qua mở đầu
              </Button>
            </motion.div>
            
            <div className="flex items-center justify-end px-2">
              <label className="flex items-center gap-3 cursor-pointer group/toggle">
                <div className="relative w-8 h-4 bg-white/10 rounded-full border border-white/5 transition-colors group-hover/toggle:bg-white/20">
                    <input
                      type="checkbox"
                      checked={!!userSettings?.autoSkipIntro}
                      onChange={(e) => autoSkipMutation.mutate(e.target.checked)}
                      className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div 
                        animate={{ x: userSettings?.autoSkipIntro ? 16 : 0 }}
                        className={`w-4 h-4 rounded-full shadow-lg ${userSettings?.autoSkipIntro ? 'bg-[#ef4444]' : 'bg-white/40'}`}
                    />
                </div>
                <span className="text-[10px] font-black text-white/30 group-hover/toggle:text-white/60 transition-colors uppercase tracking-[0.3em] italic">AUTOSKIP</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification - Neural Glass */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, scale: 0.9, filter: "blur(20px)" }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-[200] px-8 py-5 rounded-[24px] glass-pro bg-black/60 border border-white/10 text-white text-[14px] font-black italic uppercase tracking-widest shadow-cinematic-2xl flex items-center gap-4 whitespace-nowrap pointer-events-auto"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse shadow-[0_0_10px_#ef4444]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Neural Glow for Cinema Feel */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#3b82f6]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#ef4444]/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
