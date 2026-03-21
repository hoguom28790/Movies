"use client";

import React, { useState } from "react";
import { ListPlus } from "lucide-react";
import { ComicPlaylistModal } from "./ComicPlaylistModal";

interface ComicPlaylistBtnProps {
  comicSlug: string;
  comicTitle: string;
  coverUrl: string;
}

export function ComicPlaylistBtn({ comicSlug, comicTitle, coverUrl }: ComicPlaylistBtnProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-8 py-5 bg-surface-container-highest/20 backdrop-blur-md text-on-surface rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] hover:bg-surface-bright/30 transition-all border border-white/5 shadow-xl group"
      >
        <ListPlus className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
        <span>Lưu Playlist</span>
      </button>

      <ComicPlaylistModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        comicSlug={comicSlug}
        comicTitle={comicTitle}
        coverUrl={coverUrl}
      />
    </>
  );
}
