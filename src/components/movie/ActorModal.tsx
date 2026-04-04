"use client";

import React, { useState, Fragment, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Heart, Star, Calendar, Search, ExternalLink, Image as ImageIcon, MapPin, Ruler, User, Smile, Zap, PlayCircle, TrendingUp, Tv } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number | string;
    name: string;
    profile_path?: string | null;
    profilePath?: string | null;
  } | null;
  isXX?: boolean;
}

export function ActorModal({ isOpen, onClose, actor, isXX = false }: ActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error" } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const { data: details, isLoading } = useQuery({
    queryKey: [isXX ? "actor-javlib" : "actor-details", isXX ? actor?.name?.toLowerCase() : actor?.id],
    queryFn: async () => {
      if (!actor) return null;
      if (isXX) {
        try {
          const detailRes = await fetch(`/api/javlibrary/actress/${encodeURIComponent(actor.name)}`);
          if (!detailRes.ok) throw new Error("Metadata unreachable");
          const json = await detailRes.json();
          if (json.toast) {
            setToast({ message: json.toast, type: "info" });
            setTimeout(() => setToast(null), 3000);
          }
          return json;
        } catch (err) {
          return {
            id: actor.id,
            source: "fallback",
            realName: actor.name,
            stageName: actor.name,
            birthDate: "Đang cập nhật",
            measurements: "N/A",
            height: "N/A",
            profileImage: actor.profile_path || actor.profilePath || "/placeholder-actor.png",
            gallery: [],
            filmography: [],
            studio: "Elite Art"
          };
        }
      } else {
        return getTMDBActorDetails(actor.id as number);
      }
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const checkFav = async () => {
      if (user?.uid && actor?.id) {
        const { isFavoriteActor } = await import("@/services/db");
        if (isXX) {
          const stableId = actor.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const status = await isFavoriteActor(user.uid, stableId, 'topxx');
          setIsFav(status);
        } else {
          const status = await isFavoriteActor(user.uid, actor.id, 'movie');
          setIsFav(status);
        }
      }
    };
    if (isOpen) checkFav();
  }, [user?.uid, actor, isOpen, isXX]);

  const normalize = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").replace(/(phan|part|season|tap)\s*\d+/gi, "").trim();
  };

  const handleMovieClick = async (title: string, year: string, code?: string) => {
    try {
      setToast({ message: `Đang kết nối: ${code || title}...`, type: "info" });
      const { searchMovies } = await import("@/services/api/index");
      
      if (isXX) {
        const queryStr = code || title;
        // Search main streaming first
        const streamingRes = await searchMovies(queryStr, 1, "hop");
        const streamMatch = streamingRes.items.find((item: any) => {
          const itemCode = (item.movie_code || item.origin_name || "").toLowerCase();
          return itemCode.includes((code || "").toLowerCase()) || 
                 item.slug.includes((code || "").toLowerCase().replace("-", ""));
        }) || streamingRes.items[0];

        if (streamMatch) {
          onClose();
          router.push(`/xem/ophim/${streamMatch.slug}/full`);
          return;
        }

        // TopXX Fallback
        const topxxRes = await searchMovies(queryStr, 1, "tx");
        const topxxMatch = topxxRes.items[0];

        if (topxxMatch) {
          onClose();
          router.push(`/${TOPXX_PATH}/watch/${topxxMatch.slug}`);
        } else {
          setToast({ message: `Phim ${code || title} chưa có trên site.`, submessage: "Vui lòng xem trên JAVDB hoặc quay lại sau.", type: "error" });
          window.open(`https://javdb.com/search?q=${code || title}`, "_blank");
        }
      } else {
        const normalizedTitle = normalize(title);
        const searchRes = await searchMovies(normalizedTitle);
        const match = searchRes.items.find((item: any) => {
          const itemTitle = normalize(item.title);
          const itemYear = parseInt(item.year);
          const targetYear = parseInt(year);
          return itemTitle === normalizedTitle && (year ? Math.abs(itemYear - targetYear) <= 1 : true);
        }) || searchRes.items[0];

        if (match) {
          onClose();
          router.push(`/xem/${match.slug}`); 
        } else {
          setToast({ message: "Sản phẩm chưa có mặt trên cửa hàng.", type: "error" });
        }
      }
    } catch (error) {
       setToast({ message: "Lỗi kết nối.", type: "error" });
    }
  };

  const handleToggleFav = async () => {
    if (!user) {
      setToast({ message: "Vui lòng đăng nhập.", type: "error" });
      return;
    }
    if (!actor) return;
    try {
      const { toggleFavoriteActor } = await import("@/services/db");
      if (isXX) {
        const stableId = actor.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        await toggleFavoriteActor(user.uid, {
          id: stableId,
          name: actor.name,
          profilePath: (details?.profileImage || actor.profile_path || actor.profilePath || null) as (string | null),
          type: 'topxx'
        });
      } else {
        await toggleFavoriteActor(user.uid, {
          id: actor.id,
          name: actor.name,
          profilePath: (actor.profile_path || null) as (string | null),
          type: 'movie'
        });
      }
      setIsFav(!isFav);
    } catch (err) {}
  };

  if (!mounted) return null;

  const profileImageUrl = isXX 
    ? (details?.profileImage || actor?.profile_path || actor?.profilePath || "")
    : (getTMDBImageUrl((actor?.profile_path || actor?.profilePath || null) as string | null, 'w500') || "https://placehold.co/600x600/111111/4ade80?text=No+Actor");

  const movieCredits = !isXX ? (details?.combined_credits?.cast || []).filter((m: any) => m.media_type === 'movie').sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)) : [];
  const tvCredits = !isXX ? (details?.combined_credits?.cast || []).filter((m: any) => m.media_type === 'tv').sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)) : [];

  return createPortal(
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-700" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto no-scrollbar pt-safe pb-safe">
            <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-10 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-800" enterFrom="opacity-0 translate-y-64" enterTo="opacity-100 translate-y-0" leave="ease-in duration-500" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-64">
                <Dialog.Panel className={cn(
                  "relative w-full transform bg-background text-foreground transition-all sm:rounded-[48px] border border-foreground/10 shadow-2xl flex flex-col overflow-hidden",
                  isXX ? "h-[100vh] sm:h-[90vh] max-w-7xl" : "h-[85vh] max-w-6xl"
                )}>
                  <button onClick={onClose} className={cn(
                    "absolute p-4 rounded-3xl glass-pro text-foreground hover:text-primary z-[100] border border-foreground/10 active-depth transition-all",
                    isXX ? "top-6 right-6 opacity-60 hover:opacity-100" : "top-6 right-6 p-3 rounded-2xl"
                  )}>
                    <X className={cn("w-6 h-6", isXX && "stroke-[3px]")} />
                  </button>
                  
                  <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                      {isXX ? (
                        <div className="relative h-[350px] sm:h-[550px] bg-cover bg-center" style={{ backgroundImage: `url(${details?.profileImage})` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                          <div className="absolute bottom-0 left-0 w-full p-8 sm:p-16 md:p-20 flex flex-col sm:flex-row items-end gap-10 sm:gap-14">
                            <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-[56px] overflow-hidden border-[10px] border-background shadow-2xl flex-shrink-0 relative group">
                               <img src={profileImageUrl} alt={actor?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-2000" onError={(e) => { (e.target as any).src = `https://via.placeholder.com/300x450/0f1115/ffffff?text=${encodeURIComponent(actor?.name || "Elite Artist")}` }} />
                            </div>
                            <div className="space-y-6 pb-6">
                               <div className="space-y-2">
                                 {details?.studio && <span className="text-[12px] font-black text-primary uppercase italic tracking-[0.4em]">{details.studio} ELITE</span>}
                                 <h3 className="text-5xl sm:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] font-headline drop-shadow-2xl">{actor?.name}</h3>
                               </div>
                               <div className="flex flex-wrap gap-5 items-center">
                                  <span className="px-6 py-3 rounded-2xl bg-primary text-white text-[11px] font-black tracking-widest uppercase italic border border-primary/20 shadow-lg">PRIMARY ARTIST</span>
                                  {details?.source?.includes('jav') && (
                                    <span className="px-6 py-3 rounded-2xl bg-yellow-500/10 text-yellow-500 text-[11px] font-black tracking-widest uppercase italic border border-yellow-500/20">{details.source.toUpperCase()} SYNC</span>
                                  )}
                                  <button onClick={() => { onClose(); router.push(`/${TOPXX_PATH}/dien-vien/${actor?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`); }} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground/60 hover:text-primary hover:bg-foreground/10 transition-all font-black uppercase italic tracking-widest text-[11px]"><Search className="w-4 h-4" /> TẤT CẢ PHIM</button>
                                  <button onClick={handleToggleFav} className={`p-4 rounded-2xl border transition-all active-depth ${isFav ? 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg' : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground hover:bg-foreground/10'}`}><Heart className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} /></button>
                               </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 sm:p-12 md:p-16 flex flex-col sm:flex-row gap-10 items-center sm:items-end bg-gradient-to-b from-primary/10 to-transparent">
                            <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden border-8 border-background shadow-2xl flex-shrink-0">
                               <img src={profileImageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-4 text-center sm:text-left pb-4">
                               <h3 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-foreground uppercase leading-none font-headline">{actor?.name}</h3>
                               <div className="flex gap-4 items-center justify-center sm:justify-start">
                                   <button 
                                     onClick={() => { 
                                       onClose(); 
                                       router.push(`/dien-vien/${actor?.id}`); 
                                     }} 
                                     className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground/60 hover:text-primary hover:bg-foreground/10 transition-all font-black uppercase italic tracking-widest text-[11px]"
                                   >
                                     <User className="w-4 h-4" /> XEM HỒ SƠ
                                   </button>
                                   <button onClick={handleToggleFav} className={`p-3 rounded-2xl border transition-all active-depth ${isFav ? 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg' : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground'}`}><Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} /></button>
                               </div>
                            </div>
                        </div>
                      )}

                      <div className={cn("px-8 sm:px-16 md:px-24", isXX ? "py-12" : "pb-12")}>
                        {isLoading ? (
                           <div className="space-y-12 py-10 opacity-20"><div className="w-40 h-8 bg-foreground/10 animate-pulse rounded-full" /><div className="w-40 h-8 bg-foreground/10 animate-pulse rounded-full" /></div>
                        ) : details && (
                          <Tab.Group>
                            <Tab.List className={cn(
                              "flex gap-14 border-b border-foreground/10 overflow-x-auto no-scrollbar",
                              isXX ? "mb-14 sticky top-0 bg-background/90 backdrop-blur-3xl z-[60] py-8 -mx-8 sm:-mx-16 md:-mx-24 px-8 sm:px-16 md:px-24" : "mb-10"
                            )}>
                              {(isXX ? ["THÔNG TIN CÁ NHÂN", "GALLERY", "FILMOGRAPHY"] : ["PHIM LẺ", "PHIM TRUYỀN HÌNH"]).map((name) => (
                                 <Tab key={name} className={({ selected }) => `pb-8 text-[13px] sm:text-[15px] font-black tracking-[0.3em] outline-none uppercase italic transition-all relative ${selected ? "text-primary" : "text-foreground/20 hover:text-foreground"}`}>
                                   {({ selected }) => (<>{name}{selected && <motion.div layoutId="activeActorTab" className="absolute bottom-0 left-0 right-0 h-[5px] bg-primary rounded-full" />}</>)}
                                 </Tab>
                              ))}
                            </Tab.List>
                            <Tab.Panels>
                              {isXX ? (
                                <>
                                  <Tab.Panel className="grid grid-cols-1 md:grid-cols-2 gap-20 focus:outline-none">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                                          {[
                                            { label: "Nghệ danh", value: details.stageName, icon: User },
                                            { label: "Tên thật", value: details.realName, icon: Smile },
                                            { label: "Ngày sinh", value: details.birthDate, icon: Calendar },
                                            { label: "Số đo 3 vòng", value: details.measurements, icon: Ruler },
                                            { label: "Chiều cao", value: details.height, icon: Ruler },
                                            { label: "Quê quán", value: details.birthPlace, icon: MapPin },
                                            { label: "Studio", value: details.studio || "Various", icon: Tv },
                                            { label: "Debut Year", value: details.debutYear || "N/A", icon: Play },
                                            { label: "Status", value: details.status || "Active", icon: TrendingUp }
                                          ].map((stat, i) => (
                                            <div key={i} className="flex flex-col gap-3 group">
                                               <span className="text-[11px] text-foreground/20 font-black uppercase tracking-widest italic">{stat.label}</span>
                                               <span className="text-2xl sm:text-3xl font-black text-foreground italic uppercase tracking-tighter group-hover:text-primary transition-colors">{stat.value || "Protected"}</span>
                                            </div>
                                          ))}
                                     </div>
                                     <div className="relative group aspect-[4/5] rounded-[64px] overflow-hidden border border-foreground/5 shadow-cinematic-2xl">
                                        <img src={details.profileImage} className="w-full h-full object-cover transition-all duration-3000 group-hover:scale-105" />
                                     </div>
                                  </Tab.Panel>
                                  <Tab.Panel className="focus:outline-none">
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10">
                                        {details.gallery?.map((img: string, i: number) => (
                                          <button key={i} onClick={() => setLightboxImage(img)} className="group relative aspect-square rounded-[40px] overflow-hidden border border-foreground/10 active-depth bg-foreground/[0.02]">
                                             <img src={img} className="w-full h-full object-cover group-hover:scale-115 transition-all duration-1000 group-hover:brightness-50" />
                                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><ImageIcon className="w-10 h-10 text-white scale-125 shadow-2xl" /></div>
                                          </button>
                                        ))}
                                     </div>
                                  </Tab.Panel>
                                  <Tab.Panel className="focus:outline-none pb-24">
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-14">
                                        {details.filmography?.map((m: any, i: number) => (
                                          <div key={i} className="group flex flex-col gap-5">
                                               <div className="relative aspect-[2/3] rounded-[42px] overflow-hidden bg-background border border-foreground/5 shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                                                  <img src={m.poster} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-1500 group-hover:brightness-[0.25]" />
                                                  <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-700 gap-5 translate-y-6 group-hover:translate-y-0 backdrop-blur-[2px]">
                                                     <button onClick={() => handleMovieClick(m.title, m.year, m.code)} className="w-full py-5 bg-primary text-[12px] font-black text-white uppercase italic rounded-[24px] flex items-center justify-center gap-4 shadow-2xl active-depth hover:bg-[#2563eb] transition-all hover:scale-[1.05]"><Play className="w-6 h-6 fill-current" /> XEM NGAY</button>
                                                     <a href={`https://www.javlibrary.com/en/vl_searchbyid.php?keyword=${m.code.replace(/[-\s]/g, "").toLowerCase()}`} target="_blank" className="w-full py-4 glass-pro border border-foreground/10 text-[10px] font-black text-foreground/50 hover:text-foreground uppercase italic rounded-2xl flex items-center justify-center gap-3 hover:bg-foreground/10 transition-all"><ExternalLink className="w-4 h-4" /> ON JAVLIBRARY</a>
                                                  </div>
                                                  <div className="absolute top-6 left-6 glass-pro px-5 py-2 rounded-2xl border border-foreground/10 shadow-2xl"><span className="text-[12px] font-black text-primary italic uppercase tracking-widest">{m.code}</span></div>
                                                  {m.rating !== "N/A" && <div className="absolute top-6 right-6 bg-yellow-500/10 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-yellow-500/20 shadow-2xl flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500 fill-current" /><span className="text-[12px] font-black text-yellow-500">{m.rating}</span></div>}
                                               </div>
                                               <div className="px-3 space-y-2.5">
                                                  <h5 className="text-[15px] font-black text-foreground line-clamp-2 italic uppercase font-headline tracking-tight group-hover:text-primary transition-colors leading-tight h-12">{m.title}</h5>
                                                  <div className="flex justify-between items-center text-[10px] font-black text-foreground/20 uppercase italic tracking-widest">
                                                    <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary/30" /> {m.year || "N/A"}</span>
                                                    <span className="px-3 py-1 rounded-lg bg-foreground/5 border border-foreground/5">ULTRA HD</span>
                                                  </div>
                                               </div>
                                          </div>
                                        ))}
                                     </div>
                                  </Tab.Panel>
                                </>
                              ) : (
                                <>
                                  <Tab.Panel className="focus:outline-none">
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                        {movieCredits.slice(0, 50).map((m: any, idx: number) => (
                                           <motion.button key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleMovieClick(m.title, (m.release_date || "")?.split("-")[0])} className="group flex flex-col gap-4 text-left active-depth">
                                              <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-white/5 border border-white/5 shadow-xl transition-all group-hover:shadow-primary/10">
                                                 <img src={getTMDBImageUrl(m.poster_path, 'w342') || "https://placehold.co/600x900/111111/4ade80?text=No+Poster"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><Play className="w-12 h-12 text-primary fill-current" /></div>
                                              </div>
                                              <div className="px-1 text-center sm:text-left">
                                                 <h5 className="text-[14px] font-black text-white line-clamp-2 italic uppercase font-headline group-hover:text-primary transition-colors leading-tight h-10">{m.title}</h5>
                                                 <p className="text-[10px] font-black text-white/20 italic mt-1 uppercase">Năm: {(m.release_date || "")?.split("-")[0] || "N/A"}</p>
                                              </div>
                                           </motion.button>
                                        ))}
                                     </div>
                                  </Tab.Panel>
                                  <Tab.Panel className="focus:outline-none">
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                        {tvCredits.slice(0, 50).map((m: any, idx: number) => (
                                           <motion.button key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleMovieClick(m.name, (m.first_air_date || "")?.split("-")[0])} className="group flex flex-col gap-4 text-left active-depth">
                                              <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-white/5 border border-white/5 shadow-xl transition-all group-hover:shadow-primary/10">
                                                 <img src={getTMDBImageUrl(m.poster_path, 'w342') || "https://placehold.co/600x900/111111/4ade80?text=No+Poster"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><Play className="w-12 h-12 text-primary fill-current" /></div>
                                              </div>
                                              <div className="px-1 text-center sm:text-left">
                                                 <h5 className="text-[14px] font-black text-white line-clamp-2 italic uppercase font-headline group-hover:text-primary transition-colors leading-tight h-10">{m.name}</h5>
                                                 <p className="text-[10px] font-black text-white/20 italic mt-1 uppercase">Năm: {(m.first_air_date || "")?.split("-")[0] || "N/A"}</p>
                                              </div>
                                           </motion.button>
                                        ))}
                                     </div>
                                  </Tab.Panel>
                                </>
                              )}
                            </Tab.Panels>
                          </Tab.Group>
                        )}
                      </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
        <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={cn(
          "fixed bottom-10 right-10 z-[11000] p-6 rounded-2xl glass-pro shadow-2xl border border-white/10",
          isXX && "bottom-12 right-12 p-10 rounded-[48px] max-w-md backdrop-blur-3xl"
        )}><p className={cn("text-sm font-black text-white uppercase italic", isXX && "text-2xl tracking-tighter leading-none")}>{toast.message}</p></motion.div>}</AnimatePresence>
        <AnimatePresence>{isXX && lightboxImage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[12000] bg-black/98 backdrop-blur-xl flex items-center justify-center p-6 sm:p-24" onClick={() => setLightboxImage(null)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-6xl max-h-full flex items-center justify-center"><img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-[64px]" /></motion.div></motion.div>}</AnimatePresence>
      </Transition.Root>
    </>,
    document.body
  );
}
