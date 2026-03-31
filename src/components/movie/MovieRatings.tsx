"use client";

import React from "react";

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

  const tmdbScore = tmdbRating ? Math.round(tmdbRating * 10) : null;
  const imdbScore = imdbRating ? imdbRating.toFixed(1) : null;
  const criticScore = rottenRating || null;
  const finalTraktScore = traktRating ? Math.round(traktRating * 10) : null;
  const finalAudienceScore = audienceScore || null;

  const formatVotes = (v: number | string | null | undefined) => {
    if (!v) return "";
    const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    if (isNaN(n)) return v.toString();
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* TMDB */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#01B4E4] rounded-lg flex items-center justify-center text-white shrink-0 shadow-apple-sm">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M2.5 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm9.5-6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
           </svg>
        </div>
        <div className="flex flex-col">
           <span className="text-[14px] font-black leading-none">{tmdbScore ? `${tmdbScore}%` : "N/A"}</span>
           <span className="text-[8px] text-foreground/40 font-black uppercase tracking-widest mt-0.5">TMDB</span>
        </div>
      </div>

      {/* IMDb */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#F5C518] rounded-lg flex items-center justify-center text-black shrink-0 shadow-apple-sm font-black text-[9px]">
           IMDb
        </div>
        <div className="flex flex-col">
           <span className="text-[14px] font-black leading-none">{imdbScore || "N/A"}</span>
           <span className="text-[8px] text-foreground/40 font-black uppercase tracking-widest mt-0.5">IMDb</span>
        </div>
      </div>

      {/* Rotten Tomatoes */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#FA320A] rounded-lg flex items-center justify-center text-white shrink-0 shadow-apple-sm">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
           </svg>
        </div>
        <div className="flex flex-col">
           <span className="text-[14px] font-black leading-none">{criticScore ? `${criticScore}%` : "N/A"}</span>
           <span className="text-[8px] text-foreground/40 font-black uppercase tracking-widest mt-0.5">Rotten</span>
        </div>
      </div>

      {/* Trakt */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#ED1C24] rounded-lg flex items-center justify-center text-white shrink-0 shadow-apple-sm">
           <div className="font-black text-[12px]">T</div>
        </div>
        <div className="flex flex-col">
           <span className="text-[14px] font-black leading-none">{finalTraktScore ? `${finalTraktScore}%` : "N/A"}</span>
           <span className="text-[8px] text-foreground/40 font-black uppercase tracking-widest mt-0.5">Trakt</span>
        </div>
      </div>
    </div>
  );
}
