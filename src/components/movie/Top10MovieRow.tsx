"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

// Rank 1 = gold, 2 = silver, 3 = bronze, 4-10 = muted
const RANK_STYLES: Record<number, { text: string; stroke: string }> = {
  1: { text: "text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600", stroke: "rgba(251,191,36,0.3)" },
  2: { text: "text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-slate-400", stroke: "rgba(209,213,219,0.2)" },
  3: { text: "text-transparent bg-clip-text bg-gradient-to-b from-amber-500 to-orange-700", stroke: "rgba(217,119,6,0.3)" },
};

interface Top10CardProps {
  movie: Movie;
  rank: number;
}

function Top10Card({ movie, rank }: Top10CardProps) {
  const [thumbErr, setThumbErr] = useState(false);
  const rankStyle = RANK_STYLES[rank];

  return (
    <div className="flex-shrink-0 relative group" style={{ width: "130px" }}>
      {/* Poster */}
      <Link
        href={`/xem/${movie.slug}`}
        className="block relative w-full aspect-[2/3] rounded-[14px] overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03]"
      >
        <Image
          src={!thumbErr && movie.posterUrl ? movie.posterUrl : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='195'><rect width='100%' height='100%' fill='%231a1a1a'/></svg>"}
          alt={movie.title}
          fill
          sizes="130px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setThumbErr(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {movie.quality && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider rounded">
            {movie.quality}
          </div>
        )}
      </Link>

      {/* Rank number — overlapping bottom of card */}
      <div
        className="absolute -bottom-5 -left-1 pointer-events-none select-none z-10 leading-none"
        aria-label={`Hạng ${rank}`}
      >
        {rankStyle ? (
          <span
            className={cn("text-[76px] font-black leading-none", rankStyle.text)}
            style={{ WebkitTextStroke: `1.5px ${rankStyle.stroke}` }}
          >
            {rank}
          </span>
        ) : (
          <span
            className="text-[76px] font-black leading-none text-foreground/[0.12]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.04)" }}
          >
            {rank}
          </span>
        )}
      </div>

      {/* Title + year below */}
      <div className="mt-9 px-0.5">
        <Link
          href={`/xem/${movie.slug}`}
          className="block text-[11px] font-bold text-foreground line-clamp-1 hover:text-primary transition-colors"
          title={movie.title}
        >
          {movie.title}
        </Link>
        {movie.year && (
          <span className="text-[9px] text-foreground/40">{movie.year}</span>
        )}
      </div>
    </div>
  );
}

interface Top10MovieRowProps {
  title: string;
  movies: Movie[];
  viewAllHref?: string;
}

export function Top10MovieRow({ title, movies, viewAllHref }: Top10MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const top10 = movies.slice(0, 10);
  if (!top10.length) return null;

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-12 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Xem tất cả <ChevronRight size={14} />
            </Link>
          )}
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full bg-surface border border-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all hover:bg-foreground/5"
              aria-label="Cuộn trái"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full bg-surface border border-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all hover:bg-foreground/5"
              aria-label="Cuộn phải"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable row — extra pb for rank numbers overflow */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-6 lg:px-12 pb-14"
      >
        {top10.map((movie, idx) => (
          <Top10Card key={movie.slug} movie={movie} rank={idx + 1} />
        ))}
      </div>
    </section>
  );
}
