"use client";

import React from "react";
import { Star, Heart, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieRatingsProps {
  tmdbRating?: number;
  imdbId?: string;
  imdbRating?: number;
  rottenRating?: number;
  traktRating?: number;
  className?: string;
}

export function MovieRatings({ 
  tmdbRating, 
  imdbRating, 
  rottenRating, 
  traktRating,
  className 
}: MovieRatingsProps) {
  if (!tmdbRating && !imdbRating && !rottenRating && !traktRating) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {tmdbRating && tmdbRating > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest text-center">TMDB</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
            <Star className="w-3.5 h-3.5 text-blue-500 fill-current" />
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">{(tmdbRating).toFixed(1)}</span>
          </div>
        </div>
      )}

      {imdbRating && imdbRating > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest text-center">IMDB</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shadow-sm">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span className="text-xs font-black text-yellow-600 dark:text-yellow-500">{(imdbRating).toFixed(1)}</span>
          </div>
        </div>
      )}

      {rottenRating && rottenRating > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest text-center">TOMATO</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-black text-red-600 dark:text-red-400">{rottenRating}%</span>
          </div>
        </div>
      )}

      {traktRating && traktRating > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest text-center">TRAKT</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
            <span className="text-xs font-black text-pink-600 dark:text-pink-400">{(traktRating).toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
