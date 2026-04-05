"use client";

import React, { useState, useEffect } from "react";
import {
  Star, Heart, Check, Play, User, Calendar, Smile, Ruler,
  MapPin, Tv, TrendingUp, Image as ImageIcon, PlayCircle, Loader2, Film,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavoriteActor, isFavoriteActor } from "@/services/db";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";
import Link from "next/link";

interface ActorProfileProps {
  actorName: string;
  slug: string;
  isXX?: boolean;
}

export function ActorProfile({ actorName, slug, isXX = false }: ActorProfileProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const { data: details, isLoading, error } = useQuery({
    queryKey: [isXX ? "actress-topxx" : "actor-details-profile", actorName.toLowerCase()],
    queryFn: async () => {
      if (!isXX) return null;
      // Use the new robust aggregate endpoint (AVDB → JAVDB → JavLibrary)
      const res = await fetch(`/api/topxx/actress/${encodeURIComponent(actorName)}`);
      if (!res.ok) throw new Error("Actress API failed");
      return res.json();
    },
    enabled: isXX,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  useEffect(() => {
    if (user) {
      isFavoriteActor(user.uid, slug, isXX ? "topxx" : "movie").then(setIsFav);
    }
  }, [user, slug, isXX]);

  const handleToggleFav = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu diễn viên yêu thích!");
      return;
    }
    const success = await toggleFavoriteActor(user.uid, {
      id: slug,
      name: actorName,
      profilePath: details?.profileImage || "",
      type: isXX ? "topxx" : "movie",
    });
    if (success !== undefined) setIsFav(success);
  };

  if (isLoading && isXX) {
    return (
      <div className="relative mb-20 space-y-12 animate-in fade-in duration-500">
        <div className="relative rounded-[48px] overflow-hidden border border-white/5 bg-foreground/[0.02] h-auto lg:h-[450px]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent z-10" />
          <div className="relative p-8 md:p-16 flex flex-col lg:flex-row items-center lg:items-end gap-10 md:gap-16 h-full">
            <div className="w-48 h-48 md:w-72 md:h-72 rounded-[56px] bg-foreground/10 flex-shrink-0 border-4 border-foreground/5 shadow-2xl" />
            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-4 flex flex-col items-center lg:items-start">
                <div className="h-6 w-32 bg-yellow-500/20 rounded-2xl" />
                <div className="h-16 md:h-24 w-64 md:w-96 bg-foreground/5 rounded-2xl" />
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="h-12 w-24 bg-foreground/5 rounded-2xl" />
                <div className="h-12 w-24 bg-foreground/5 rounded-2xl" />
                <div className="h-12 w-24 bg-foreground/5 rounded-2xl" />
              </div>
              <div className="flex justify-center lg:justify-start">
                 <div className="h-14 w-48 bg-foreground/10 rounded-[32px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileImageUrl = details?.profileImage || "";
  const filmography: any[] = details?.filmography || [];

  return (
    <div className="relative mb-20 space-y-12">
      {/* ─── PROFILE HEADER ────────────────────────────────────────── */}
      <div className={cn(
        "relative rounded-[48px] overflow-hidden border border-white/5 shadow-cinematic-2xl transition-all duration-1000",
        isXX
          ? "bg-gradient-to-br from-yellow-500/10 via-background to-background"
          : "bg-gradient-to-br from-primary/10 via-background to-background"
      )}>
        {/* Background blur from profile image */}
        {profileImageUrl && (
          <div
            className="absolute inset-0 opacity-10 bg-cover bg-center blur-3xl scale-110"
            style={{ backgroundImage: `url(${profileImageUrl})` }}
          />
        )}

        <div className="relative p-8 md:p-16 flex flex-col lg:flex-row items-center lg:items-end gap-10 md:gap-16">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "w-48 h-48 md:w-72 md:h-72 rounded-full overflow-hidden border-4 shadow-2xl relative group flex-shrink-0 cursor-pointer",
              isXX ? "bg-yellow-500/5 border-yellow-500/20" : "bg-primary/5 border-primary/20"
            )}
            onClick={() => profileImageUrl && setLightboxImage(profileImageUrl)}
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                alt={actorName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  // Try smart fallback for TopXX actors
                  if (isXX) {
                    const parts = slug.split('-');
                    if (parts.length === 2 && !target.src.includes(`${parts[1]}_${parts[0]}`)) {
                       target.src = `https://javmodel.com/javdata/uploads/${parts[1]}_${parts[0]}150.jpg`;
                       return;
                    }
                    if (!target.src.includes(`${slug.replace(/-/g, '_')}150.jpg`)) {
                       target.src = `https://javmodel.com/javdata/uploads/${slug.replace(/-/g, '_')}150.jpg`;
                       return;
                    }
                  }
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className={cn("w-full h-full flex flex-col items-center justify-center font-black transition-all", isXX ? "bg-yellow-500/10 text-yellow-500/50" : "bg-primary/10 text-primary/50")}>
                <span className="text-[100px] md:text-[140px] leading-none select-none tracking-tighter drop-shadow-xl">{actorName.charAt(0).toUpperCase()}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-50 absolute bottom-6 md:bottom-10">Avatar Pending</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              </div>

              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-foreground uppercase italic tracking-tighter leading-none select-none drop-shadow-2xl">
                {actorName}
              </h1>

              {/* Enhanced Stats Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 pt-2">
                {details?.birthDate && details.birthDate !== "N/A" && (
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="text-[9px] font-black uppercase text-yellow-500/50 tracking-widest italic">NGÀY SINH</span>
                    <span className="text-lg font-black text-foreground italic tracking-tight">{details.birthDate}</span>
                  </div>
                )}
                {details?.measurements && details.measurements !== "N/A" && (
                  <div className="flex flex-col items-center lg:items-start border-l border-foreground/10 pl-8">
                    <span className="text-[9px] font-black uppercase text-yellow-500/50 tracking-widest italic">SỐ ĐO</span>
                    <span className="text-lg font-black text-foreground italic tracking-tight">{details.measurements.replace(/cm/gi, '').trim()}</span>
                  </div>
                )}
                {details?.height && details.height !== "N/A" && (
                  <div className="flex flex-col items-center lg:items-start border-l border-foreground/10 pl-8">
                    <span className="text-[9px] font-black uppercase text-yellow-500/50 tracking-widest italic">CHIỀU CAO</span>
                    <span className="text-lg font-black text-foreground italic tracking-tight">{details.height}</span>
                  </div>
                )}
                {details?.bodyType && details.bodyType !== "N/A" && (
                  <div className="flex flex-col items-center lg:items-start border-l border-foreground/10 pl-8">
                    <span className="text-[9px] font-black uppercase text-yellow-500/50 tracking-widest italic">MODEL STYLES</span>
                    <Link 
                      href={`/${TOPXX_PATH}/dien-vien/style/${encodeURIComponent(details.bodyType)}`}
                      className="text-lg font-black text-yellow-500 italic tracking-tight hover:underline underline-offset-4"
                    >
                      {details.bodyType}
                    </Link>
                  </div>
                )}
              </div>

              {details?.studio && details.studio !== "N/A" && (
                <p className="text-foreground/40 font-bold uppercase tracking-[0.3em] text-[10px] md:text-[11px] italic">
                  {details.studio} EXCLUSIVE
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
              <Button
                onClick={handleToggleFav}
                className={cn(
                  "rounded-[32px] px-8 md:px-10 h-14 md:h-16 text-[10px] md:text-sm font-black uppercase tracking-widest shadow-2xl transition-all active-depth",
                  isFav
                    ? "bg-foreground text-background"
                    : isXX
                      ? "bg-yellow-500 text-black shadow-yellow-500/30"
                      : "bg-primary text-white shadow-primary/30"
                )}
              >
                {isFav ? <Check className="w-4 h-4 md:w-5 md:h-5 mr-3" /> : <Heart className="w-4 h-4 md:w-5 md:h-5 mr-3" />}
                {isFav ? "Đã Yêu Thích" : "Yêu Thích Diễn Viên"}
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* ─── FILMOGRAPHY (Bottom Full Width) ──────────────────────── */}
      {isXX && filmography.length > 0 && (
        <div className="animate-in slide-in-from-bottom duration-1000 delay-300">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
                FILMOGRAPHY
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] block mb-1">AVAILABLE TITLES</span>
              <span className="text-2xl font-black text-foreground italic">{filmography.length}+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {filmography.map((film: any, idx: number) => {
              // Determine watch route
              let watchHref = "#";
              if (film.source === "avdb" || film.slug?.startsWith("av-")) {
                 watchHref = `/${TOPXX_PATH}/watch/av-${(film.slug || film.id)?.replace("av-", "") || idx}`;
              } else if (film.code) {
                 watchHref = `/${TOPXX_PATH}/watch/${film.code.toLowerCase().replace(/\s+/g, "-")}`;
              }

              return (
                <motion.div
                  key={`${film.code || idx}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Link href={watchHref} className="group block space-y-4">
                    <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-surface border border-foreground/5 shadow-xl group-hover:shadow-yellow-500/20 transition-all duration-500">
                      {film.poster ? (
                        <img
                          src={film.poster}
                          alt={film.title || film.code}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-[0.3]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                          <Film className="w-10 h-10 text-foreground/10" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-6 h-6 text-black fill-current ml-0.5" />
                        </div>
                      </div>

                      {film.code && (
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{film.code}</span>
                        </div>
                      )}
                    </div>

                    <div className="px-1 space-y-1.5">
                      <h4 className="text-sm font-black text-foreground line-clamp-2 italic uppercase tracking-tight group-hover:text-yellow-500 transition-colors leading-tight">
                        {film.title || film.code || "No Title"}
                      </h4>
                      {film.year && film.year !== "N/A" && (
                        <div className="flex items-center gap-2 text-foreground/20 italic">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{film.year}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-20"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-full max-h-full">
              <img
                src={lightboxImage}
                className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-4 border-white/5"
              />
              <button className="absolute -top-12 right-0 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                ĐÓNG <Check className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
