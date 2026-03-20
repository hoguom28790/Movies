"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveXXHistory, getMovieXXHistory } from "@/services/xxDb";
import { useAuth } from "@/contexts/AuthContext";
import { saveXXFirestoreHistory, getXXFirestoreHistory } from "@/services/xxFirestore";

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
  const { user } = useAuth();
  const [isPseudoFS, setIsPseudoFS] = useState(false);
  const lastSaveTime = useRef(0);
  const lastCloudSaveTime = useRef(0);

  useEffect(() => {
    const attemptSeek = async () => {
      let progress = 0;
      
      // Get local history first
      const history = getMovieXXHistory(movieCode);
      if (history) progress = history.progressSeconds;
      
      // If logged in, cloud history takes precedence if it's newer
      if (user) {
        try {
          const cloudHistory = await getXXFirestoreHistory(user.uid);
          const match = cloudHistory.find(h => h.movieCode === movieCode);
          if (match && match.updatedAt > (history?.updatedAt || 0)) {
            progress = match.progressSeconds;
          }
        } catch (e) {}
      }

      if (progress > 0) {
        const iframe = document.getElementById('xx-player') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SEEK', time: progress }, '*');
        }
      }
      
      // Initial save
      const entryData = {
        movieCode,
        movieTitle,
        posterUrl,
        progressSeconds: progress,
        durationSeconds: history?.durationSeconds || 0
      };
      saveXXHistory(entryData);
      if (user) saveXXFirestoreHistory(user.uid, entryData);
    };

    const timer1 = setTimeout(attemptSeek, 1000);
    const timer2 = setTimeout(attemptSeek, 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [movieCode, movieTitle, posterUrl, user]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;

      if (event.data.type === 'UPDATE_PROGRESS') {
        const now = Date.now();
        const entryData = {
          movieCode,
          movieTitle,
          posterUrl,
          progressSeconds: event.data.time,
          durationSeconds: event.data.duration || 0
        };

        // Local Save (5s throttle)
        if (now - lastSaveTime.current > 5000) {
          lastSaveTime.current = now;
          saveXXHistory(entryData);
        }
        
        // Cloud Save (15s throttle)
        if (user && now - lastCloudSaveTime.current > 15000) {
          lastCloudSaveTime.current = now;
          saveXXFirestoreHistory(user.uid, entryData);
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

  const isDirectVideo = url.includes('.m3u8') || url.includes('.mp4') || url.includes('.mkv') || url.includes('.ts') || url.includes('m3u8') || url.includes('mp4');

  const iframeSrc = isDirectVideo 
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
