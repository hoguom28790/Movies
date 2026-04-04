"use client";

import React, { useState, useEffect } from "react";
import {
  Star, Heart, Check, Play, User, Calendar, Smile, Ruler,
  MapPin, Tv, TrendingUp, Image as ImageIcon, PlayCircle, Loader2, Film
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
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
          <p className="text-foreground/20 text-[10px] font-black uppercase tracking-widest italic animate-pulse">
            Đang tải hồ sơ diễn viên...
          </p>
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
              "w-48 h-48 md:w-72 md:h-72 rounded-[56px] overflow-hidden border-4 shadow-2xl relative group flex-shrink-0 cursor-pointer",
              isXX ? "bg-yellow-500/5 border-yellow-500/20" : "bg-primary/5 border-primary/20"
            )}
            onClick={() => profileImageUrl && setLightboxImage(profileImageUrl)}
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                alt={actorName}
              />
            ) : (
              <User className={cn("w-24 h-24 m-auto mt-12 md:mt-24", isXX ? "text-yellow-500/20" : "text-primary/20")} />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <span className={cn(
                  "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-xl",
                  isXX
                    ? "bg-yellow-500 text-black border-yellow-500 shadow-yellow-500/20"
                    : "bg-primary text-white border-primary shadow-primary/20"
                )}>
                  PREMIUM ARTIST
                </span>
                {details?.source && (
                  <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-foreground/5 border border-foreground/10 text-foreground/30 italic">
                    {details.source.toUpperCase()} SYNC
                  </span>
                )}
                <div className="flex items-center gap-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </div>

              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-foreground uppercase italic tracking-tighter leading-none select-none drop-shadow-2xl">
                {actorName}
              </h1>

              {details?.studio && details.studio !== "N/A" && (
                <p className="text-foreground/40 font-bold uppercase tracking-[0.3em] text-[10px] md:text-[11px] italic">
                  {details.studio} EXCLUSIVE
                </p>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              {details?.birthDate && details.birthDate !== "N/A" && (
                <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10">
                  <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-widest">Born</span>
                  <span className="text-xs font-black text-foreground italic">{details.birthDate}</span>
                </div>
              )}
              {details?.height && details.height !== "N/A" && (
                <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10">
                  <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-widest">Height</span>
                  <span className="text-xs font-black text-foreground italic">{details.height}</span>
                </div>
              )}
              {details?.measurements && details.measurements !== "N/A" && (
                <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10">
                  <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-widest">Measurements</span>
                  <span className="text-xs font-black text-foreground italic">{details.measurements}</span>
                </div>
              )}
              {filmography.length > 0 && (
                <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-[8px] font-black uppercase text-yellow-500/60 italic tracking-widest">Titles</span>
                  <span className="text-xs font-black text-yellow-500 italic">{filmography.length}+</span>
                </div>
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

      {/* ─── BIOGRAPHICAL INFO + GALLERY ───────────────────────────── */}
      {isXX && details && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-bottom duration-1000">
          {/* Detailed Stats */}
          <div className="bg-surface rounded-[40px] p-8 md:p-12 border border-foreground/5 shadow-xl space-y-10">
            <div className="flex items-center gap-4 border-b border-foreground/5 pb-6">
              <Smile className="w-6 h-6 text-yellow-500" />
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Thông tin cá nhân</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {[
                { label: "Nghệ danh", value: details.stageName, icon: User },
                { label: "Tên thật", value: details.realName, icon: Smile },
                { label: "Ngày sinh", value: details.birthDate, icon: Calendar },
                { label: "Số đo 3 vòng", value: details.measurements, icon: Ruler },
                { label: "Chiều cao", value: details.height, icon: Ruler },
                { label: "Quê quán", value: details.birthPlace, icon: MapPin },
                { label: "Studio / Hãng", value: details.studio, icon: Tv },
                { label: "Năm debut", value: details.debutYear, icon: Play },
                { label: "Trạng thái", value: details.status, icon: TrendingUp },
              ].filter(s => s.value && s.value !== "N/A" && s.value !== "Đang cập nhật").map((stat, i) => (
                <div key={i} className="space-y-1 group">
                  <p className="text-[9px] font-black uppercase text-foreground/20 tracking-widest italic">{stat.label}</p>
                  <p className="text-lg md:text-xl font-black text-foreground/80 italic tracking-tight group-hover:text-yellow-500 transition-colors">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="bg-surface rounded-[40px] p-8 md:p-12 border border-foreground/5 shadow-xl space-y-10">
            <div className="flex items-center justify-between border-b border-foreground/5 pb-6">
              <div className="flex items-center gap-4">
                <ImageIcon className="w-6 h-6 text-yellow-500" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Gallery</h3>
              </div>
              {details.gallery?.length > 0 && (
                <span className="text-[10px] font-black text-foreground/20">{details.gallery.length} ẢNH</span>
              )}
            </div>

            {details.gallery?.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {details.gallery.slice(0, 6).map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImage(img)}
                    className="relative aspect-square rounded-3xl overflow-hidden bg-foreground/5 border border-foreground/5 group"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:brightness-50"
                      alt={`gallery-${i}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-foreground/10 border-2 border-dashed border-foreground/5 rounded-3xl">
                <ImageIcon className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">No gallery available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FILMOGRAPHY GRID ──────────────────────────────────────── */}
      {isXX && filmography.length > 0 && (
        <div className="animate-in slide-in-from-bottom duration-1000 delay-200">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-2 h-8 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/40" />
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-foreground">
                FILMOGRAPHY
              </h2>
              <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest italic">
                {filmography.length} tác phẩm đã đóng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filmography.map((film: any, idx: number) => {
              // Determine watch route based on source
              const watchHref = film.source === "avdb"
                ? `/${TOPXX_PATH}/watch/av-${film.slug?.replace("av-", "") || idx}`
                : `/${TOPXX_PATH}/watch/${film.code?.toLowerCase().replace(/\s+/g, "-") || idx}`;

              return (
                <motion.div
                  key={`${film.code}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.03, 0.3) }}
                  className="group flex flex-col gap-3"
                >
                  <Link href={watchHref} className="block">
                    <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-surface border border-foreground/5 shadow-xl group-hover:shadow-yellow-500/20 transition-all duration-500">
                      {film.poster ? (
                        <img
                          src={film.poster}
                          alt={film.title || film.code}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-[0.3]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                          <Film className="w-8 h-8 text-foreground/10" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                        </div>
                      </div>
                      {/* Code badge */}
                      {film.code && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                          <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{film.code}</span>
                        </div>
                      )}
                      {/* Rating badge */}
                      {film.rating && film.rating !== "N/A" && (
                        <div className="absolute top-2 right-2 bg-yellow-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-yellow-500/30 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                          <span className="text-[9px] font-black text-yellow-500">{film.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="px-1 space-y-1 mt-2">
                      <h4 className="text-[12px] font-black text-foreground line-clamp-2 italic uppercase tracking-tight group-hover:text-yellow-500 transition-colors leading-tight">
                        {film.title || film.code || "No Title"}
                      </h4>
                      {film.year && film.year !== "N/A" && (
                        <p className="text-[9px] font-black text-foreground/20 uppercase italic flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {film.year}
                        </p>
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
