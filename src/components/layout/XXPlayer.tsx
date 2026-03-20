"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveXXHistory, getMovieXXHistory } from "@/services/xxDb";

interface XXPlayerProps {
  url: string;
  isHls: boolean;
  rawEmbedUrl: string;
  nextEpisodeUrl?: string;
  movieTitle: string;
  movieCode: string;
  posterUrl: string;
  episodeName?: string;
}

export function XXPlayer({ 
  url, 
  isHls, 
  rawEmbedUrl, 
  nextEpisodeUrl, 
  movieTitle, 
  movieCode, 
  posterUrl,
  episodeName 
}: XXPlayerProps) {
  const router = useRouter();
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const lastSaveTime = useRef(0);

  useEffect(() => {
    const attemptSeek = () => {
      const history = getMovieXXHistory(movieCode);
      if (history && history.progressSeconds > 0) {
        const iframe = document.getElementById('xx-player') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SEEK', time: history.progressSeconds }, '*');
        }
      }
      
      // Register visit
      saveXXHistory({
        movieCode,
        movieTitle,
        posterUrl,
        progressSeconds: history?.progressSeconds || 0,
        durationSeconds: history?.durationSeconds || 0
      });
    };

    const timer = setTimeout(attemptSeek, 1500);
    return () => clearTimeout(timer);
  }, [movieCode, movieTitle, posterUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;

      if (event.data.type === 'UPDATE_PROGRESS') {
        const now = Date.now();
        if (now - lastSaveTime.current > 10000) { // Throttle 10s
          lastSaveTime.current = now;
          saveXXHistory({
            movieCode,
            movieTitle,
            posterUrl,
            progressSeconds: event.data.time,
            durationSeconds: event.data.duration || 0
          });
        }
      }

      if (event.data.type === 'VIDEO_ENDED') {
        if (nextEpisodeUrl) {
          router.push(nextEpisodeUrl);
        }
      }

      if (event.data.type === 'ENTER_PSEUDO_FULLSCREEN') setIsPseudoFS(true);
      if (event.data.type === 'EXIT_PSEUDO_FULLSCREEN') setIsPseudoFS(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [movieCode, movieTitle, posterUrl, nextEpisodeUrl, router]);

  const iframeSrc = isHls 
    ? `/player.html?url=${encodeURIComponent(url)}`
    : rawEmbedUrl || `/player.html?url=${encodeURIComponent(url)}`;

  return (
    <div className={isPseudoFS 
      ? "fixed inset-0 w-screen h-screen z-[9999] bg-black"
      : "w-full aspect-video relative shadow-2xl bg-black overflow-hidden rounded-xl border border-white/5"
    }>
      <iframe
        id="xx-player"
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0"
        allowFullScreen
      />
    </div>
  );
}
