"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight, Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

interface SpotlightMovieSectionProps {
  movies: Movie[];
  title?: string;
  viewAllHref?: string;
}

export function SpotlightMovieSection({
  movies,
  title = "Phim mới cập nhật",
  viewAllHref = "/phim-moi",
}: SpotlightMovieSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const currentMovie = movies[selectedIndex];

  const selectMovie = useCallback(
    (index: number) => {
      if (index === selectedIndex) return;
      setIsAnimating(true);
      setImgError(false);
      setTimeout(() => {
        setSelectedIndex(index);
        setIsAnimating(false);
      }, 250);
    },
    [selectedIndex]
  );

  const advance = useCallback(() => {
    setIsAnimating(true);
    setImgError(false);
    setTimeout(() => {
      setSelectedIndex((prev) => (prev + 1) % movies.length);
      setIsAnimating(false);
    }, 250);
  }, [movies.length]);

  // Auto-advance every 5 seconds
  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(advance, 5000);
  }, [advance]);

  useEffect(() => {
    if (movies.length <= 1) return;
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval, movies.length]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const thumb = thumbnailRef.current.children[selectedIndex] as HTMLElement;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedIndex]);

  if (!movies.length || !currentMovie) return null;

  const genres = Array.isArray(currentMovie.category)
    ? currentMovie.category.map((c: any) => (typeof c === "string" ? c : c.name)).filter(Boolean).slice(0, 4)
    : (currentMovie.genres || []).slice(0, 4);

  const rating = currentMovie.imdbRating || currentMovie.tmdbRating;
  const thumbSrc = !imgError && currentMovie.thumbUrl ? currentMovie.thumbUrl : currentMovie.posterUrl;

  return (
    <section className="w-full space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 lg:px-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          Xem tất cả <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Main Spotlight Card */}
      <div className="px-6 lg:px-12">
        <div className="relative rounded-2xl overflow-hidden bg-surface border border-foreground/[0.05] shadow-2xl">
          {/* Backdrop */}
          <div className="absolute inset-0 z-0">
            <Image
              key={currentMovie.slug}
              src={thumbSrc || ""}
              alt={currentMovie.title}
              fill
              sizes="100vw"
              className={cn(
                "object-cover transition-all duration-500",
                isAnimating ? "opacity-0 scale-[1.03]" : "opacity-100 scale-100"
              )}
              priority
              onError={() => setImgError(true)}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          {/* Content Panel */}
          <div
            className={cn(
              "relative z-10 p-6 md:p-10 lg:p-12 flex flex-col justify-center min-h-[260px] md:min-h-[380px] lg:min-h-[420px] max-w-xl transition-all duration-300",
              isAnimating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
            )}
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {rating && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-black rounded-full border border-yellow-500/20">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {typeof rating === "number" ? rating.toFixed(1) : rating}
                </span>
              )}
              {currentMovie.quality && (
                <span className="px-2.5 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider rounded-full border border-primary/20">
                  {currentMovie.quality}
                </span>
              )}
              {currentMovie.year && (
                <span className="px-2.5 py-1 bg-white/10 text-white/70 text-[10px] font-bold rounded-full">
                  {currentMovie.year}
                </span>
              )}
              {currentMovie.status && !currentMovie.status.toLowerCase().includes("full") && (
                <span className="px-2.5 py-1 bg-white/10 text-white/70 text-[10px] font-bold rounded-full">
                  {currentMovie.status}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 line-clamp-2 tracking-tight leading-tight",
                isAnimating ? "opacity-0" : "opacity-100"
              )}
            >
              {currentMovie.title}
            </h3>

            {/* Original title */}
            {currentMovie.originalTitle && currentMovie.originalTitle !== currentMovie.title && (
              <p className="text-sm text-primary/80 font-medium mb-3 italic">
                {currentMovie.originalTitle}
              </p>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {genres.map((g: string) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white/50 border border-white/10"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {currentMovie.overview && (
              <p className="text-sm text-white/55 line-clamp-2 mb-6 max-w-sm leading-relaxed">
                {currentMovie.overview}
              </p>
            )}

            {/* Play button */}
            <div>
              <Link
                href={`/xem/${currentMovie.slug}`}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold transition-all hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/30"
              >
                <Play size={16} fill="currentColor" strokeWidth={0} />
                Xem ngay
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-20">
            <div
              key={`progress-${selectedIndex}`}
              className="h-full bg-primary origin-left"
              style={{ animation: "progressBar 5s linear forwards" }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div
        ref={thumbnailRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-6 lg:px-12 scroll-smooth"
      >
        {movies.map((movie, idx) => (
          <button
            key={movie.slug}
            onClick={() => {
              selectMovie(idx);
              resetInterval();
            }}
            className={cn(
              "flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-300 focus:outline-none",
              "w-[80px] md:w-[100px] aspect-[2/3]",
              selectedIndex === idx
                ? "ring-2 ring-primary scale-105 shadow-lg shadow-primary/25 opacity-100"
                : "opacity-50 hover:opacity-80 hover:scale-[1.02]"
            )}
          >
            <Image
              src={movie.posterUrl || ""}
              alt={movie.title}
              fill
              sizes="100px"
              className="object-cover"
            />
            {selectedIndex === idx && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl" />
            )}
          </button>
        ))}
      </div>

      <style jsx global>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
