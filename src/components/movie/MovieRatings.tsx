"use client";

import React from "react";
import { Star } from "lucide-react";

interface MovieRatingsProps {
  tmdbRating?: number | null;
  imdbId?: string | null;
  imdbRating?: number | null;
  rottenRating?: number | null;
  audienceScore?: number | null;
  traktRating?: number | null;
  traktVotes?: number | null;
  imdbVotes?: number | string | null;
  className?: string;
}

export function MovieRatings({ tmdbRating, imdbId, imdbRating, rottenRating, audienceScore, traktRating, traktVotes, imdbVotes, className = "" }: MovieRatingsProps) {
  if (!tmdbRating && !imdbRating && !traktRating) return null;

  const imdbScore = imdbRating ? imdbRating.toFixed(1) : (tmdbRating ? tmdbRating.toFixed(1) : "N/A");
  const criticScore = rottenRating || (tmdbRating ? Math.round(tmdbRating * 10) : 0);
  const finalAudienceScore = audienceScore || (tmdbRating ? Math.round(tmdbRating * 10) - 2 : 0);

  const formatVotes = (v: number | string | null | undefined) => {
    if (!v) return "";
    const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    if (isNaN(n)) return v.toString();
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className={`flex flex-wrap items-center gap-5 md:gap-7 ${className}`}>
      {/* Trakt Rating (Priority) */}
      {traktRating && (
        <div className="flex items-center gap-2 group transition-all">
          <div className="text-[#9747FF] drop-shadow-[0_0_8px_rgba(151,71,255,0.4)]">
             <Star className="w-5 h-5 fill-current" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-black text-[16px] leading-none">{Math.round(traktRating * 10)}%</span>
            {traktVotes && (
              <span className="text-[11px] text-white/40 font-bold tracking-tight uppercase transition-all cursor-default">{formatVotes(traktVotes)}</span>
            )}
          </div>
        </div>
      )}

      {/* IMDb Rating */}
      <div className="flex items-center gap-2 group">
        <div className="bg-[#E2B616] text-black px-1.5 py-0.5 rounded-sm font-black text-[10px] leading-tight tracking-tighter shadow-sm">
          IMDb
        </div>
        <div className="flex items-baseline gap-1.5">
           <span className="text-white font-black text-[16px] leading-none">{imdbScore}</span>
           {imdbVotes && (
             <span className="text-[11px] text-white/40 font-bold border-b border-white/20 ml-0.5">{formatVotes(imdbVotes)}</span>
           )}
        </div>
      </div>

      {/* Rotten Tomatoes Critics */}
      <div className="flex items-center gap-2 group">
        <div className="text-[#FA320A]">
          <svg viewBox="0 0 512 512" width="22" height="22" fill="currentColor">
            <path d="M479.5 241C479.5 358.1 391.2 453.6 280.9 453.6C170.6 453.6 82.3 358.1 82.3 241C82.3 124 170.6 28.5 280.9 28.5C391.2 28.5 479.5 124 479.5 241Z" />
          </svg>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-black text-[16px] leading-none">{criticScore}%</span>
          <span className="text-[11px] text-white/40 font-bold uppercase border-b border-white/20">Fresh</span>
        </div>
      </div>

      {/* Audience Score */}
      <div className="flex items-center gap-2 group">
        <div className="text-[#E2B616]">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M11,10.22A1,1,0,0,1,12,9h0a1,1,0,0,1,1,1.22l-.78,4.68a1,1,0,0,1-1.94,0ZM21.14,12l-1-7.15A1,1,0,0,0,19.16,4H4.84a1,1,0,0,0-1,.86l-1,7.2C1.55,13.62,1,15,1,16a5,5,0,0,0,5,5,5.13,5.13,0,0,0,3-.94,5,5,0,0,0,6,0,5.13,5.13,0,0,0,3,.94,5,5,0,0,0,5-5C23,15,22.45,13.62,21.14,12Z"/>
          </svg>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-black text-[16px] leading-none">{finalAudienceScore}%</span>
          <span className="text-[11px] text-white/40 font-bold uppercase border-b border-white/20">Hot</span>
        </div>
      </div>
    </div>
  );
}
