"use client";

import React from "react";
import Link from "next/link";
import { Play, Info, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";

interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  slug: string;
  posterUrl: string;
  year?: string;
  quality?: string;
  overview?: string;
}

interface HeroSectionProps {
  movie: Movie;
  isXX?: boolean;
}

export function HeroSection({ movie, isXX = false }: HeroSectionProps) {
  const { isIPhone } = useDevice();

  const primaryColor = isXX ? "bg-yellow-500" : "bg-primary";
  const textColor = isXX ? "text-black" : "text-white";
  const shadowColor = isXX ? "shadow-yellow-500/30" : "shadow-primary/30";
  const hoverColor = isXX ? "hover:bg-white" : "hover:bg-primary/80";

  return (
    <div className={cn(
      "relative w-full overflow-hidden mb-20 group shadow-cinematic-xl bg-surface-tonal",
      isIPhone ? "h-[70vh] min-h-[500px] rounded-[48px]" : "h-[85vh] min-h-[700px] rounded-[64px]"
    )}>
      
      {/* Background Image with Parallax & Pro Gradients */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[5000ms]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/10 to-transparent hidden md:block" />
      </motion.div>

      {/* Hero Content */}
      <div className={cn(
        "absolute inset-0 flex flex-col justify-end z-10",
        isIPhone ? "p-8 pb-12" : "p-12 md:p-24 pb-20"
      )}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "max-w-5xl",
            isIPhone ? "space-y-6" : "space-y-10"
          )}
        >
          
          {/* Badge & Meta Data */}
          <div className="flex flex-wrap items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 font-black text-[11px] rounded-xl uppercase italic shadow-lg",
                primaryColor,
                textColor,
                shadowColor
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              TOP RATED
            </motion.div>
            
            <div className="flex items-center gap-2 text-foreground/50 text-[11px] font-black uppercase tracking-[0.25em] italic">
              <Calendar className="w-4 h-4" />
              {movie.year || "2025"}
            </div>
            
            {!isIPhone && (
              <div className="px-3 py-1 glass-pro rounded-xl text-foreground/70 font-black text-[10px] uppercase italic tracking-[0.2em]">
                {movie.quality || "ULTRA HD"}
              </div>
            )}
            
            <div className="px-3 py-1 glass rounded-xl text-foreground/40 font-black text-[10px] uppercase italic tracking-[0.2em] border-none bg-foreground/5">
              DOLBY VISION
            </div>
          </div>

          <div className="space-y-4 md:space-y-8">
            <h1 className={cn(
              "font-black text-foreground leading-[0.8] tracking-tighter uppercase italic select-none drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]",
              isIPhone ? "text-5xl" : "text-7xl md:text-[160px]"
            )}>
              {movie.title}
            </h1>

            <p className={cn(
              "text-foreground/50 font-medium italic line-clamp-2 md:line-clamp-3 leading-relaxed max-w-3xl border-l-4 pl-6",
              isIPhone ? "text-[14px]" : "text-lg md:text-2xl",
              isXX ? "border-yellow-500/20" : "border-primary/20"
            )}>
              {movie.originalTitle && <span className={cn("block mb-3 not-italic font-black text-[12px] uppercase tracking-[0.4em]", isXX ? "text-yellow-500" : "text-primary")}>{movie.originalTitle}</span>}
              {movie.overview || "Khám phá đỉnh cao của nghệ thuật thứ bảy. Một trải nghiệm điện ảnh chân thực, sống động và đầy chiều sâu đang chờ đợi bạn."}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-8 pt-6">
            <Link href={isXX ? `/v2k9r5w8m3x7n1p4q0z6/xem/${movie.slug}` : `/xem/${movie.slug}`} className="w-full md:w-auto">
              <Button 
                size="lg" 
                className={cn(
                  "w-full rounded-[32px] font-black uppercase italic tracking-tighter group/play shadow-cinematic-xl transition-all duration-500 active-depth hover:scale-[1.02]",
                  isIPhone ? "h-16 text-lg" : "h-24 px-14 text-3xl",
                  primaryColor,
                  textColor,
                  hoverColor
                )}
              >
                <Play className={cn("fill-current group-hover/play:scale-125 transition-transform duration-500", isIPhone ? "w-6 h-6 mr-3" : "w-10 h-10 mr-5")} /> 
                Xem Ngay
              </Button>
            </Link>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link href={isXX ? `/v2k9r5w8m3x7n1p4q0z6/phim/${movie.slug}` : `/phim/${movie.slug}`} className="flex-1 md:flex-none">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className={cn(
                    "w-full rounded-[32px] glass-pro text-foreground font-black uppercase tracking-[0.2em] italic hover:bg-foreground/10 transition-all active-depth",
                    isIPhone ? "h-16 text-xs" : "h-24 px-12 text-sm"
                  )}
                >
                  <Info className={cn(isIPhone ? "w-5 h-5 mr-3" : "w-8 h-8 mr-4")} /> Details
                </Button>
              </Link>
              <WatchlistBtn 
                movieSlug={!isXX ? movie.slug : undefined}
                movieCode={isXX ? movie.id : undefined}
                movieTitle={movie.title} 
                posterUrl={movie.posterUrl}
                isXX={isXX}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
