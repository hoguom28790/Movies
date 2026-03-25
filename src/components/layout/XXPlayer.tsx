"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { saveHistory, getMovieHistory } from "@/services/db";

interface XXPlayerProps {
  url: string;
  isHls: boolean;
  rawEmbedUrl: string;
  nextEpisodeUrl?: string;
  movieTitle: string;
  movieCode: string; // The Slug/ID used for history
  posterUrl: string;
}

export function XXPlayer({ 
  url, 
  movieTitle, 
  movieCode, 
  posterUrl,
  nextEpisodeUrl
}: XXPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [isEmbed, setIsEmbed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const lastSaveTimeRef = useRef(0);
  const hasSeekedRef = useRef(false);

  // 1. Resolve Stream URL
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      setIsLoading(true);
      try {
        console.log(`[XXPlayer/Resolve] Resolving: ${url}`);
        const res = await fetch(`/api/topxx/resolve?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setResolvedUrl(data.url);
            setIsEmbed(data.type === 'embed');
          }
        } else {
          // Fallback to original URL
          if (active) {
            setResolvedUrl(url);
            setIsEmbed(true);
          }
        }
      } catch (e) {
        if (active) {
          setResolvedUrl(url);
          setIsEmbed(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    
    resolve();
    return () => { active = false; };
  }, [url]);

  // 2. Resume History on Mount
  useEffect(() => {
    if (!user || !resolvedUrl || hasSeekedRef.current) return;

    const resume = async () => {
      const history = await getMovieHistory(user.uid, movieCode, 'topxx');
      if (history && history.progressSeconds > 10) {
        console.log(`[XXPlayer] Resume History Found: ${history.progressSeconds}s`);
        const iframe = document.getElementById('xx-player-dashboard') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
           iframe.contentWindow.postMessage({ type: 'SEEK', time: history.progressSeconds }, '*');
           hasSeekedRef.current = true;
        }
      }
    };

    const timer = setTimeout(resume, 2000); // Wait for player.html to be ready
    return () => clearTimeout(timer);
  }, [user, resolvedUrl, movieCode]);

  // 3. Listen for Progress from player.html
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_PROGRESS') {
        const { time, duration } = event.data;
        const now = Date.now();
        
        // Save every 15 seconds to Firebase
        if (user && now - lastSaveTimeRef.current > 15000 && time > 10) {
          lastSaveTimeRef.current = now;
          saveHistory(user.uid, {
            movieSlug: movieCode,
            movieTitle,
            episodeName: "Full",
            episodeSlug: "full",
            posterUrl: posterUrl?.startsWith('http') ? posterUrl : `https://img.ophim1.com/uploads/movies/${posterUrl}`,
            progressSeconds: Math.floor(time),
            durationSeconds: Math.floor(duration || 0),
            progress: duration > 0 ? Math.round((time / duration) * 100) : 0,
            source: 'topxx'
          }).then(() => {
            console.log(`[XXPlayer] Progress saved: ${Math.floor(time)}s`);
          }).catch(console.error);
        }
      }

      if (event.data?.type === 'VIDEO_ENDED' && nextEpisodeUrl) {
        router.push(nextEpisodeUrl);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, movieCode, movieTitle, posterUrl, nextEpisodeUrl, router]);

  const iframeSrc = resolvedUrl 
    ? `/player.html?url=${encodeURIComponent(resolvedUrl)}&isEmbed=${isEmbed}&theme=topxx`
    : "";

  return (
    <div className="w-full aspect-video relative shadow-2xl bg-black overflow-hidden rounded-3xl border border-white/5 group">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black gap-4">
           <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
           <p className="text-[10px] font-black text-yellow-500/40 uppercase tracking-[0.3em] italic">Giải mã nguồn phát...</p>
        </div>
      )}
      {iframeSrc && (
        <iframe
          id="xx-player-dashboard"
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      )}
    </div>
  );
}
