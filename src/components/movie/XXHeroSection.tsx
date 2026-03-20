"use client";

import React from "react";
import Link from "next/link";
import { Play, Info, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { XXFavoriteBtn } from "@/components/movie/XXFavoriteBtn";
import { useDevice } from "@/contexts/DeviceContext";

interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  slug: string;
  posterUrl: string;
  year?: string;
  quality?: string;
  content?: string;
}

interface XXHeroSectionProps {
  movie: Movie;
}

export function XXHeroSection({ movie }: XXHeroSectionProps) {
  const { isIPhone } = useDevice();

  return (
    <div className={`relative w-full ${
      isIPhone ? "h-[50vh] min-h-[380px] rounded-[24px]" : "h-[70vh] md:h-[80vh] min-h-[500px] rounded-[40px]"
    } overflow-hidden mb-12 group`}>
      {/* Background Image with Parallax & Gradients */}
      <div className="absolute inset-0 scale-105 group-hover:scale-110 transition-transform duration-[3000ms] ease-out">
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover opacity-60 blur-[1px]" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className={`absolute inset-0 flex flex-col justify-end ${
        isIPhone ? "p-6" : "p-8 md:p-16 lg:p-24"
      }`}>
        <div className={`max-w-3xl ${
          isIPhone ? "space-y-4" : "space-y-6 md:space-y-8"
        } animate-in fade-in slide-in-from-bottom-8 duration-1000`}>
          {/* Badge & Year */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-yellow-500 text-black font-black text-[9px] rounded-full uppercase italic shadow-lg shadow-yellow-500/20">HOT NOW</span>
            <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold font-mono">
              <Calendar className="w-3 h-3" />
              {movie.year || "2024"}
            </div>
            {!isIPhone && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="px-2 py-0.5 bg-white/10 rounded-md text-white/80 font-black text-[10px] uppercase tracking-wider">{movie.quality || "HD"}</div>
              </>
            )}
          </div>

          <h1 className={`${
            isIPhone ? "text-3xl" : "text-5xl md:text-8xl"
          } font-black text-white leading-[0.9] tracking-tighter uppercase italic select-none`}>
            {movie.title}
          </h1>

          <p className={`${
            isIPhone ? "text-sm" : "text-lg md:text-xl"
          } text-white/50 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl`}>
            {movie.originalTitle && <span className="text-white/80 block mb-1">{movie.originalTitle}</span>}
            Trải nghiệm điện ảnh đỉnh cao tại TopXX. Khám phá những câu chuyện hấp dẫn và hình ảnh sống động ngay bây giờ.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/xx/movie/${movie.slug}?play=true`}>
              <Button 
                size={isIPhone ? "md" : "lg"} 
                className={`${isIPhone ? "h-12 px-6 text-sm" : "h-12 md:h-16 px-6 md:px-10 text-lg"} rounded-xl font-black uppercase tracking-widest group/play shadow-xl shadow-yellow-500/30`}
              >
                <Play className={`${isIPhone ? "w-4 h-4 mr-2" : "w-6 h-6 mr-3"} fill-current group-hover/play:scale-125 transition-transform`} /> Xem Ngay
              </Button>
            </Link>
            
            <Link href={`/xx/movie/${movie.slug}`}>
              <Button 
                variant="secondary" 
                size={isIPhone ? "md" : "lg"} 
                className={`${isIPhone ? "h-12 px-6 text-sm" : "h-12 md:h-16 px-6 md:px-10 text-lg"} rounded-xl bg-white/5 backdrop-blur-xl border-white/10 font-black uppercase tracking-widest hover:bg-white/10 transition-all`}
              >
                <Info className={`${isIPhone ? "w-4 h-4 mr-2" : "w-6 h-6 mr-3"}`} /> Chi Tiết
              </Button>
            </Link>

            <XXFavoriteBtn movieCode={movie.id} movieTitle={movie.title} posterUrl={movie.posterUrl} />
          </div>
        </div>
      </div>

      {/* Decorative Shadow Overlay */}
      {!isIPhone && <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0a0a0a]/20 to-transparent pointer-events-none" />}
    </div>
  );
}
