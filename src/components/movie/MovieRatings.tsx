"use client";

import React from "react";
import { Star } from "lucide-react";

interface MovieRatingsProps {
  tmdbRating?: number | null;
  imdbId?: string | null;
  imdbRating?: number | null;
  rottenRating?: number | null;
  audienceScore?: number | null;
  className?: string;
}

export function MovieRatings({ tmdbRating, imdbId, imdbRating, rottenRating, audienceScore, className = "" }: MovieRatingsProps) {
  if (!tmdbRating && !imdbRating) return null;

  const imdbScore = imdbRating ? imdbRating.toFixed(1) : (tmdbRating ? tmdbRating.toFixed(1) : "N/A");
  const criticScore = rottenRating || (tmdbRating ? Math.round(tmdbRating * 10) : 0);
  const finalAudienceScore = audienceScore || (tmdbRating ? Math.round(tmdbRating * 10) - 2 : 0);

  return (
    <div className={`flex flex-wrap items-center gap-6 ${className}`}>
      {/* IMDb Rating */}
      <div className="flex items-center gap-2 group transition-transform hover:scale-105">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-[#f5c518] text-black font-black text-xs shadow-lg shadow-[#f5c518]/20">
          IMDb
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-black text-sm leading-none">{imdbScore}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-tighter mt-1 font-bold">Rating</span>
        </div>
      </div>

      {/* Rotten Tomatoes Critics */}
      <div className="flex items-center gap-2 group transition-transform hover:scale-105">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-[#fa320a] text-white shadow-lg shadow-[#fa320a]/20">
          <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor">
            <path d="M479.5 241C479.5 358.1 391.2 453.6 280.9 453.6C170.6 453.6 82.3 358.1 82.3 241C82.3 124 170.6 28.5 280.9 28.5C391.2 28.5 479.5 124 479.5 241ZM309.1 140.2C309.1 140.2 309.2 140.2 309.1 140.2ZM325.2 92.5C313.2 101.9 303.4 114.3 294.4 126.3C287.6 135.5 281.3 145.4 275.6 155.1C268.4 148.2 260.6 142 252.1 136.7C218.6 115.6 179.9 110.1 142.1 113.8C143.2 112 144.3 110.3 145.6 108.6C153.3 98.7 163 89.9 174.1 82.7L181.6 77.9C154.5 73.1 126.7 80.2 104.9 96.6C83.2 113 70 137.1 68.8 162.7C49.9 164.7 33 172.9 21.3 186.2C6.9 202.7 0 224.2 0 245.9C0 268 7.3 289.4 18.5 307.7C29.6 326 44.5 341.2 61.3 351.4C78.1 361.6 96.9 366.8 115.5 366.8C127.3 366.8 139 364.7 149.9 360.5C186.1 405.3 243.6 433 308.2 433C402.6 433 479.1 346.7 479.1 240.2C479.1 180.2 454.4 126.2 414.9 88.5C384.6 115.6 348.6 134.1 309.1 140.2Z" />
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-black text-sm leading-none">{criticScore}%</span>
          <span className="text-[10px] text-white/30 uppercase tracking-tighter mt-1 font-bold">Tomatoes</span>
        </div>
      </div>

      {/* Audience Score */}
      <div className="flex items-center gap-2 group transition-transform hover:scale-105">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-[#e1c12c] text-black shadow-lg shadow-[#e1c12c]/20">
           <Star className="h-5 w-5 fill-current" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-black text-sm leading-none">{finalAudienceScore}%</span>
          <span className="text-[10px] text-white/30 uppercase tracking-tighter mt-1 font-bold">Audience</span>
        </div>
      </div>
    </div>
  );
}
