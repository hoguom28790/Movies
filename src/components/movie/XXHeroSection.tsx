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
      isIPhone ? "h-[65vh] min-h-[450px] rounded-[48px]" : "h-[75vh] md:h-[85vh] min-h-[600px] rounded-[64px]"
    } overflow-hidden mb-16 group shadow-2xl shadow-black`}>
      {/* Background Image with Parallax & Gradients */}
      <div className="absolute inset-0 scale-105 group-hover:scale-110 transition-transform duration-[4000ms] ease-out">
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:hidden" />
      </div>

      {/* Hero Content */}
      <div className={`absolute inset-0 flex flex-col justify-end ${
        isIPhone ? "p-8 pb-10" : "p-12 md:p-20 lg:p-24 pb-16 md:pb-24"
      }`}>
        <div className={`max-w-4xl ${
          isIPhone ? "space-y-6" : "space-y-8 md:space-y-12"
        } animate-in fade-in slide-in-from-bottom-12 duration-[1500ms] ease-out`}>
          
          {/* Badge & Year */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-black font-black text-[10px] rounded-lg uppercase italic shadow-2xl shadow-yellow-500/30">
              <Play className="w-3 h-3 fill-current" />
              TOP RATED
            </div>
            <div className="flex items-center gap-2 text-white/40 text-[11px] font-black uppercase tracking-[0.2em] italic">
              <Calendar className="w-3.5 h-3.5" />
              {movie.year || "2025"}
            </div>
            {!isIPhone && (
              <div className="px-3 py-1 bg-white/5 border border-white/5 backdrop-blur-md rounded-lg text-white/60 font-black text-[10px] uppercase italic tracking-[0.2em]">{movie.quality || "ULTRA HD"}</div>
            )}
          </div>

          <div className="space-y-4 md:space-y-6">
            <h1 className={`${
              isIPhone ? "text-5xl" : "text-7xl md:text-[140px]"
            } font-black text-white leading-[0.85] tracking-tighter uppercase italic select-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]`}>
              {movie.title}
            </h1>

            <p className={`${
              isIPhone ? "text-[13px]" : "text-lg md:text-2xl"
            } text-white/40 font-medium italic line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl`}>
              {movie.originalTitle && <span className="text-yellow-500/80 block mb-2 not-italic font-black text-[10px] uppercase tracking-[0.3em]">{movie.originalTitle}</span>}
              Siêu phẩm điện ảnh độc quyền chỉ có tại TopXX. Khám phá những câu chuyện hấp dẫn và hình ảnh sống động đỉnh cao ngay bây giờ.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 pt-4">
            <Link href={`/xx/movie/${movie.slug}?play=true`} className="w-full md:w-auto">
              <Button 
                size="lg" 
                className={`${isIPhone ? "h-16 text-lg" : "h-20 px-12 text-2xl"} w-full rounded-[28px] font-black uppercase italic tracking-tighter group/play shadow-[0_20px_40px_-12px_rgba(234,179,8,0.4)] bg-yellow-500 text-black hover:bg-white transition-all duration-500`}
              >
                <Play className={`${isIPhone ? "w-5 h-5 mr-3" : "w-8 h-8 mr-4"} fill-current group-hover/play:scale-125 transition-transform duration-500`} /> Xem Ngay
              </Button>
            </Link>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link href={`/xx/movie/${movie.slug}`} className="flex-1 md:flex-none">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className={`${isIPhone ? "h-16 text-[11px]" : "h-20 px-10 text-xs"} w-full rounded-[28px] bg-white/5 backdrop-blur-3xl border-white/10 font-black uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all border-dashed`}
                >
                  <Info className={`${isIPhone ? "w-4 h-4 mr-2" : "w-6 h-6 mr-3"}`} /> Details
                </Button>
              </Link>
              <XXFavoriteBtn movieCode={movie.id} movieTitle={movie.title} posterUrl={movie.posterUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
