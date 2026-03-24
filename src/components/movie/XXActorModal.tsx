// XXActorModal.tsx - Premium JAV Elite Archive with Primary JAVLIBRARY sync and fallback JAVDB bio/gallery
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, Film, Tv, Info, Search, ChevronRight, Heart, Sparkles, TrendingUp, ExternalLink, Image as ImageIcon, MapPin, Ruler, User, Smile } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface XXActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number | string;
    name: string;
    profile_path?: string | null;
  } | null;
}

interface JAVLibraryActress {
  id: string;
  source: string;
  realName: string;
  stageName: string;
  birthDate: string;
  measurements: string;
  height: string;
  profileImage: string;
  birthPlace?: string;
  gallery: string[];
  filmography: {
    code: string;
    title: string;
    poster: string;
    year: string;
    rating: string;
    previewImage: string;
  }[];
  studio?: string;
  debutYear?: string;
  status?: string;
}

export function XXActorModal({ isOpen, onClose, actor }: XXActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error" } | null>(null);
  const [isFav, setIsFav] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor-javlib", actor?.name?.toLowerCase()],
    queryFn: async () => {
      if (!actor) return null;
      try {
        console.log("Fetching JavLibrary data for:", actor.name);
        // Switched to JavLibrary primary scraper for stable actress data
        const detailRes = await fetch(`/api/javlibrary/actress/${encodeURIComponent(actor.name)}`);
        if (!detailRes.ok) throw new Error("Metadata unreachable");
        const json = await detailRes.json();
        
        if (json.toast) {
           setToast({ message: json.toast, type: "info" });
           setTimeout(() => setToast(null), 3000);
        }
        
        return json;
      } catch (err) {
        console.error("JavLibrary Sync Error:", err);
        return null;
      }
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  useEffect(() => {
    const checkFav = async () => {
      const effectiveId = details?.id || actor?.id;
      if (user?.uid && effectiveId) {
        const { isFavoriteActor } = await import("@/services/db");
        const status = await isFavoriteActor(user.uid, effectiveId, 'topxx');
        setIsFav(status);
      }
    };
    if (isOpen) checkFav();
  }, [user?.uid, actor?.id, details, isOpen]);

  const normalize = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").replace(/(phan|part|season|tap)\s*\d+/gi, "").trim();
  };

  const handleMovieClick = async (title: string, year: string, code?: string) => {
    try {
      console.log(`[TOPXX-ACTOR] Searching for: ${title} (${code})`);
      setToast({ message: `Đang kết nối kho phim TopXX cho: ${code || title}...`, type: "info" });
      
      const { searchMovies: searchTopXX } = await import("@/services/api/index"); // Assume index exports search
      const { normalizeTitle } = await import("@/lib/normalize");
      
      // SEARCH TOPXX FIRST (Since it's a TopXX actress)
      const query = code || title;
      const res = await fetch(`/api/topxx/search?q=${encodeURIComponent(query)}`);
      const searchRes = await res.json();
      
      let match = searchRes.items?.find((item: any) => {
        const itemCode = (item.movie_code || item.origin_name || "").toLowerCase();
        const targetCode = (code || "").toLowerCase();
        return itemCode.includes(targetCode) || normalizeTitle(item.title) === normalizeTitle(title);
      }) || searchRes.items?.[0];

      if (match) {
        setToast({ message: `Đã tìm thấy! Chuyển hướng đến ${match.title}...`, type: "info" });
        setTimeout(() => {
           onClose();
           router.push(`/v2k9r5w8m3x7n1p4q0z6/phim/${match.slug}`); 
        }, 500);
      } else {
        // Falling back to Hồ Phim search just in case
        setToast({ message: "Phim chưa có bản Full. Thử tìm bản Hồ Phim...", type: "info" });
        const { searchMovies: searchStreaming } = await import("@/services/api");
        const hopRes = await searchStreaming(query);
        const hopMatch = hopRes.items[0];
        
        if (hopMatch) {
            onClose();
            router.push(`/phim/${hopMatch.slug}`);
        } else {
            setToast({ message: `Phim ${code || title} hiện chưa có trên hệ thống.`, type: "error" });
        }
      }
    } catch (error) {
       console.error("[ACTOR] Search failed:", error);
       setToast({ message: "Máy chủ TopXX đang bận. Thử lại sau.", type: "error" });
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
      const effectiveId = details?.id || actor.id;
      await toggleFavoriteActor(user.uid, {
        id: effectiveId,
        name: actor.name,
        profilePath: (details?.profileImage || actor.profile_path || null) as (string | null),
        type: 'topxx'
      });
      setIsFav(!isFav);
    } catch (err) {}
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-700" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-500" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-3xl" /></Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto no-scrollbar pt-safe pb-safe">
          <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-10 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-800" enterFrom="opacity-0 translate-y-64" enterTo="opacity-100 translate-y-0" leave="ease-in duration-500" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-64">
              <Dialog.Panel className="relative w-full h-[100vh] sm:h-[90vh] max-w-7xl transform bg-[#0a0a0b] text-left transition-all sm:rounded-[48px] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 p-4 rounded-3xl glass-pro text-white hover:text-primary z-[100] border border-white/10 active-depth transition-all opacity-60 hover:opacity-100"><X className="w-6 h-6 stroke-[3px]" /></button>
                <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="relative h-[350px] sm:h-[550px] bg-cover bg-center" style={{ backgroundImage: `url(${details?.profileImage})` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full p-8 sm:p-16 md:p-20 flex flex-col sm:flex-row items-end gap-10 sm:gap-14">
                        <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-[56px] overflow-hidden border-[10px] border-[#0a0a0b] shadow-2xl flex-shrink-0 relative group">
                           <img src={details?.profileImage || actor?.profile_path || ""} alt={actor?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-2000" />
                        </div>
                        <div className="space-y-6 pb-6">
                           <div className="space-y-2">
                             {details?.studio && <span className="text-[12px] font-black text-primary uppercase italic tracking-[0.4em]">{details.studio} ELITE</span>}
                             <h3 className="text-5xl sm:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] font-headline">{actor?.name}</h3>
                           </div>
                           <div className="flex flex-wrap gap-5 items-center">
                              <span className="px-6 py-3 rounded-2xl bg-primary text-white text-[11px] font-black tracking-widest uppercase italic border border-primary/20 shadow-lg">PRIMARY ARTIST</span>
                              {details?.source === "javlibrary" ? <span className="px-6 py-3 rounded-2xl bg-yellow-500/10 text-yellow-500 text-[11px] font-black tracking-widest uppercase italic border border-yellow-500/20">JAVLIB SYNC</span> : details?.source === "javdb" ? <span className="px-6 py-3 rounded-2xl bg-yellow-500/10 text-yellow-500 text-[11px] font-black tracking-widest uppercase italic border border-yellow-500/20">JAVDB SYNC</span> : <span className="px-6 py-3 rounded-2xl bg-yellow-500/10 text-yellow-500 text-[11px] font-black tracking-widest uppercase italic border border-yellow-500/20">FALLBACK MODE</span>}
                              <button onClick={handleToggleFav} className={`p-4 rounded-2xl border transition-all active-depth ${isFav ? 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}><Heart className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} /></button>
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-8 sm:px-16 md:px-24 py-12">
                      {isLoading ? (
                         <div className="space-y-12 py-10">
                            {[1,2,3].map(i => <div key={i} className="w-40 h-8 bg-white/5 animate-pulse rounded-full" />) }
                         </div>
                      ) : details ? (
                        <Tab.Group>
                          <Tab.List className="flex gap-14 border-b border-white/5 mb-14 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur-3xl z-[60] py-8 -mx-8 sm:-mx-16 md:-mx-24 px-8 sm:px-16 md:px-24">
                            {["THÔNG TIN CÁ NHÂN", "GALLERY", "FILMOGRAPHY"].map((name) => (
                               <Tab key={name} className={({ selected }) => `pb-8 text-[13px] sm:text-[15px] font-black tracking-[0.3em] outline-none uppercase italic transition-all relative ${selected ? "text-primary" : "text-white/20 hover:text-white"}`}>
                                 {({ selected }) => (<>{name}{selected && <motion.div layoutId="activeActorTab" className="absolute bottom-0 left-0 right-0 h-[5px] bg-primary rounded-full" />}</>)}
                               </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels>
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
                                         <span className="text-[11px] text-white/20 font-black uppercase tracking-widest italic">{stat.label}</span>
                                         <span className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-primary transition-colors">{stat.value || "Protected"}</span>
                                      </div>
                                    ))}
                               </div>
                               <div className="relative group aspect-[4/5] rounded-[64px] overflow-hidden border border-white/5 shadow-cinematic-2xl">
                                  <img src={details.profileImage} className="w-full h-full object-cover transition-all duration-3000 group-hover:scale-105" />
                               </div>
                            </Tab.Panel>
                            <Tab.Panel className="focus:outline-none">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10">
                                  {details.gallery.map((img: string, i: number) => (
                                    <button key={i} onClick={() => setLightboxImage(img)} className="group relative aspect-square rounded-[40px] overflow-hidden border border-white/5 active-depth bg-white/[0.02]">
                                       <img src={img} className="w-full h-full object-cover group-hover:scale-115 transition-all duration-1000 group-hover:brightness-50" />
                                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><ImageIcon className="w-10 h-10 text-white scale-125" /></div>
                                    </button>
                                  ))}
                               </div>
                            </Tab.Panel>
                            <Tab.Panel className="focus:outline-none pb-24">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-14">
                                  {details.filmography.map((m: any, i: number) => (
                                    <div key={i} className="group flex flex-col gap-5">
                                         <div className="relative aspect-[2/3] rounded-[42px] overflow-hidden bg-black border border-white/5 shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                                            <img src={m.poster} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-1500 group-hover:brightness-[0.25]" />
                                            <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-700 gap-5 translate-y-6 group-hover:translate-y-0 backdrop-blur-[2px]">
                                               <button onClick={() => handleMovieClick(m.title, m.year, m.code)} className="w-full py-5 bg-primary text-[12px] font-black text-white uppercase italic rounded-[24px] flex items-center justify-center gap-4 shadow-2xl active-depth hover:bg-[#2563eb] transition-all hover:scale-[1.05]"><Play className="w-6 h-6 fill-current" /> XEM NGAY</button>
                                               <a href={`https://www.javlibrary.com/en/vl_searchbyid.php?keyword=${m.code.replace(/[-\s]/g, "").toLowerCase()}`} target="_blank" className="w-full py-4 glass-pro border border-white/10 text-[10px] font-black text-white/50 hover:text-white uppercase italic rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"><ExternalLink className="w-4 h-4" /> ON JAVLIBRARY</a>
                                            </div>
                                            <div className="absolute top-6 left-6 glass-pro px-5 py-2 rounded-2xl border border-white/10 shadow-2xl"><span className="text-[12px] font-black text-primary italic uppercase tracking-widest">{m.code}</span></div>
                                            {m.rating !== "N/A" && <div className="absolute top-6 right-6 bg-yellow-500/10 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-yellow-500/20 shadow-2xl flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500 fill-current" /><span className="text-[12px] font-black text-yellow-500">{m.rating}</span></div>}
                                         </div>
                                         <div className="px-3 space-y-2.5">
                                            <h5 className="text-[15px] font-black text-white line-clamp-2 italic uppercase font-headline tracking-tight group-hover:text-primary transition-colors leading-tight h-12">{m.title}</h5>
                                            <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase italic tracking-widest">
                                              <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary/30" /> {m.year || "N/A"}</span>
                                              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5">ULTRA HD</span>
                                            </div>
                                         </div>
                                    </div>
                                  ))}
                               </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      ) : null}
                    </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed bottom-12 right-12 z-[3000] p-10 rounded-[48px] glass-pro shadow-2xl border border-white/10 max-w-md backdrop-blur-3xl"><p className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{toast.message}</p></motion.div>}</AnimatePresence>
      <AnimatePresence>{lightboxImage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] bg-black/98 backdrop-blur-xl flex items-center justify-center p-6 sm:p-24" onClick={() => setLightboxImage(null)}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-6xl max-h-full flex items-center justify-center"><img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-[64px]" /></motion.div></motion.div>}</AnimatePresence>
    </Transition.Root>
  );
}
