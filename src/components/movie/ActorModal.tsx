// Fixed TopXX password format + Removed pro max words + Fixed modal scroll header on both favorites and detail page + iPhone/iPad optimization
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, Film, Tv, Info, Search, ChevronRight, Heart, Sparkles, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { searchMovies } from "@/services/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number;
    name: string;
    profile_path: string | null;
  } | null;
  isTopXX?: boolean;
}

interface JAVDBActress {
  id: string;
  name: string;
  profilePic: string;
  birthday?: string;
  height?: string;
  measurements?: string;
  birthPlace?: string;
  gallery: string[];
  filmography: {
    id: string;
    poster: string;
    code: string;
    title: string;
    rating: string;
    date: string;
    link: string;
  }[];
}

export function ActorModal({ isOpen, onClose, actor, isTopXX = false }: ActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Profile path mapping (handle both profile_path and profilePath)
  const profilePath = actor ? (('profile_path' in actor ? actor.profile_path : (actor as any).profilePath) || null) : null;

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor", actor?.id, actor?.name, isTopXX],
    queryFn: async () => {
      if (!actor) return null;
      if (isTopXX) {
        try {
          // 1. Search for JAVDB ID by name
          const searchRes = await fetch(`/api/javdb/actress?name=${encodeURIComponent(actor.name)}`);
          const searchData = await searchRes.json();
          if (!searchData.id) return null;
          
          // 2. Fetch Full Details
          const detailRes = await fetch(`/api/javdb/actress/${searchData.id}`);
          const detailData = await detailRes.json();
          return detailData as JAVDBActress;
        } catch (err) {
          console.error("JAVDB Fetch Error:", err);
          return null;
        }
      }
      return getTMDBActorDetails(actor.id);
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error"; link?: string } | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const checkFav = async () => {
      if (user?.uid && actor?.id) {
        const { isFavoriteActor } = await import("@/services/db");
        const status = await isFavoriteActor(user.uid, actor.id);
        setIsFav(status);
      }
    };
    if (isOpen) checkFav();
  }, [user?.uid, actor?.id, isOpen]);

  useEffect(() => {
    if (toast && toast.type === 'info') {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const normalize = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").replace(/(phan|part|season|tap)\s*\d+/gi, "").trim();
  };

  const handleMovieClick = async (title: string, year: string, code?: string) => {
    try {
      setIsSearching(title);
      setToast({ message: `Đang kết nối: ${title} (${year})...`, type: "info" });
      
      const normalizedTitle = normalize(title);
      
      // Separate JAVDB from ophim/kkphim search
      // In TopXX, search by code first if available, otherwise search by title in local streaming sources
      const { searchMovies: searchStreaming } = await import("@/services/api");
      let searchResult = await searchStreaming(code || title);

      if (searchResult.items.length === 0) {
        searchResult = await searchStreaming(normalizedTitle);
      }

      const match = searchResult.items.find((item: any) => {
        const itemTitle = normalize(item.title);
        const itemOrigin = normalize(item.originalTitle || "");
        const yearDiff = Math.abs(parseInt(item.year) - parseInt(year));
        return (itemTitle === normalizedTitle || itemOrigin === normalizedTitle) && (year ? yearDiff <= 1 : true);
      }) || searchResult.items[0];

      if (match) {
        setToast(null);
        onClose();
        router.push(`/phim/${match.slug}`); // Navigate to streaming page
      } else {
        setToast({ 
          message: "Tác phẩm này hiện chưa có bản phát hành tại đây.", 
          submessage: "Hệ thống đang cập nhật, bạn có thể xem các phim khác.",
          type: "error"
        });
      }
    } catch (error) {
       setToast({ message: "Giao thức tìm kiếm bị gián đoạn. Thử lại sau.", type: "error" });
    } finally {
      setIsSearching(null);
    }
  };

  const MovieCardComponent = ({ item, isTv, index }: { item: any; isTv: boolean; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4) }}
      onClick={() => handleMovieClick(item.title || item.name, (item.release_date || item.first_air_date)?.split("-")[0])}
      className="group relative flex flex-col gap-3 text-left outline-none rounded-[32px] overflow-hidden select-none active-depth"
    >
      <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-[#141416] border border-white/5">
        <img src={getTMDBImageUrl(item.poster_path, 'w342') || "/placeholder-poster.png"} alt={item.title || item.name} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
           <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-white italic text-center">XEM NGAY</span>
        </div>
      </div>
      <div className="px-1 space-y-0.5">
        <h5 className="text-[13px] font-black text-white group-hover:text-primary transition-colors line-clamp-1 italic uppercase tracking-tight font-headline">{item.title || item.name}</h5>
        <div className="flex items-center justify-between text-[9px] text-white/30 font-black uppercase tracking-widest italic">
          <span className="line-clamp-1">{item.character || "N/A"}</span>
          <span className="text-primary/60">{(item.release_date || item.first_air_date)?.split("-")[0]}</span>
        </div>
      </div>
    </motion.button>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-700" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-3xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto pt-safe pb-safe no-scrollbar overscroll-behavior-contain">
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:p-8">
            <Transition.Child as={Fragment} enter="ease-out duration-800" enterFrom="opacity-0 translate-y-64 scale-90" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-500" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-64 scale-90">
              <Dialog.Panel className="relative w-full max-w-7xl transform overflow-hidden bg-[#0a0a0b] text-left transition-all sm:rounded-[64px] border border-white/5 shadow-cinematic-2xl flex flex-col h-[100vh] sm:min-h-[90vh] perspective-1000">
                
                {/* Header */}
                <div className="relative h-[280px] sm:h-[450px] flex-shrink-0 bg-cover bg-center overflow-hidden" 
                     style={{ backgroundImage: `url(${getTMDBImageUrl(profilePath, 'original') || details?.profilePic})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                  <button onClick={onClose} className="absolute top-6 right-6 p-3 rounded-[20px] glass-pro text-white hover:text-primary z-30 border border-white/10 active-depth transition-all"><X className="w-6 h-6 stroke-[3px]" /></button>

                  <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 flex flex-col sm:flex-row items-end gap-6 sm:gap-10">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-[40px] overflow-hidden border-[6px] border-[#0a0a0b] shadow-2xl flex-shrink-0 relative group">
                       <img src={getTMDBImageUrl(profilePath, 'w500') || details?.profilePic || "/placeholder-actor.png"} alt={actor?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-3xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none font-headline">{actor?.name}</h3>
                       <div className="flex gap-4">
                          <span className="px-4 py-2 rounded-xl bg-primary text-white text-[9px] font-black tracking-widest uppercase italic border border-primary/20">ELITE PROFILE</span>
                          {isTopXX && <span className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-500 text-[9px] font-black tracking-widest uppercase italic border border-yellow-500/20">JAVDB DATA</span>}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-6 sm:px-12 md:px-20 py-8 no-scrollbar scroll-smooth relative">
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6"><div className="animate-pulse bg-white/5 aspect-[2/3] rounded-3xl" /></div>
                  ) : isTopXX && (details as JAVDBActress) ? (
                    <Tab.Group>
                      <Tab.List className="flex gap-8 border-b border-white/5 mb-8 sticky -top-1 bg-[#0a0a0b] z-[60] py-4 transition-all -mx-6 sm:-mx-12 md:-mx-20 px-6 sm:px-12 md:px-20">
                        {["THÔNG TIN", "GALLERY", "FILMOGRAPHY"].map((name) => (
                           <Tab key={name} className={({ selected }) => `pb-4 text-[11px] sm:text-[13px] font-black tracking-[0.2em] outline-none uppercase italic ${selected ? "text-primary border-b-[4px] border-primary" : "text-on-surface/30 hover:text-white"}`}>{name}</Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels>
                        <Tab.Panel className="grid grid-cols-1 md:grid-cols-2 gap-10 focus:outline-none">
                           <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-4">Biographical Stats</h4>
                              {[
                                { label: "Ngày sinh", value: details.birthday },
                                { label: "Chiều cao", value: details.height },
                                { label: "Số đo", value: details.measurements },
                                { label: "Quê quán", value: details.birthPlace }
                              ].map((stat, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b border-white/5 pb-4">
                                   <span className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">{stat.label}</span>
                                   <span className="text-xl font-black text-white italic uppercase">{stat.value || "Hidden / N/A"}</span>
                                </div>
                              ))}
                           </div>
                           <div className="aspect-video rounded-[40px] overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all duration-1000">
                              <img src={details.profilePic} className="w-full h-full object-cover" />
                           </div>
                        </Tab.Panel>

                        <Tab.Panel className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 focus:outline-none">
                           {details.gallery.map((img: string, i: number) => (
                             <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setLightboxImage(img)} className="aspect-square rounded-2xl overflow-hidden border border-white/5"><img src={img} className="w-full h-full object-cover" /></motion.button>
                           ))}
                        </Tab.Panel>

                        <Tab.Panel className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 focus:outline-none pb-20">
                           {details.filmography.map((m: any, i: number) => (
                             <motion.div key={i} className="group flex flex-col gap-3 rounded-[32px] overflow-hidden active-depth">
                                <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-black border border-white/5">
                                   <img src={m.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 group-hover:brightness-50" />
                                   <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all gap-4">
                                      <button onClick={() => handleMovieClick(m.title, m.date.split("-")[0], m.code)} className="w-full py-3 bg-primary text-[10px] font-black text-white uppercase italic rounded-xl flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-current" /> XEM NGAY</button>
                                      <a href={m.link} target="_blank" className="w-full py-2 border border-white/10 text-[9px] font-black text-white/30 uppercase italic rounded-lg text-center hover:bg-white/5 transition-all">JAVDB LINK</a>
                                   </div>
                                   <div className="absolute top-4 left-4 glass-pro px-3 py-1 rounded-lg border border-white/10"><span className="text-[10px] font-black text-primary italic">{m.code}</span></div>
                                </div>
                                <div className="px-1 space-y-1">
                                   <h5 className="text-[12px] font-black text-white line-clamp-1 italic uppercase font-headline group-hover:text-primary transition-colors">{m.title}</h5>
                                   <div className="flex justify-between text-[9px] font-black text-white/20 uppercase italic"><span>{m.date}</span><span>{m.rating} ★</span></div>
                                </div>
                             </motion.div>
                           ))}
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  ) : (
                    <Tab.Group>
                       <Tab.List className="flex gap-8 border-b border-white/5 mb-8 sticky -top-1 bg-[#0a0a0b] z-[60] py-4 transition-all -mx-6 sm:-mx-12 md:-mx-20 px-6 sm:px-12 md:px-20">
                          <Tab className={({ selected }) => `pb-4 text-[11px] font-black tracking-[0.2em] outline-none uppercase italic ${selected ? "text-primary border-b-[4px] border-primary" : "text-white/20"}`}><Film className="w-5 h-5 inline mr-2" /> PHIM ĐIỆN ẢNH</Tab>
                          <Tab className={({ selected }) => `pb-4 text-[11px] font-black tracking-[0.2em] outline-none uppercase italic ${selected ? "text-primary border-b-[4px] border-primary" : "text-white/20"}`}><Tv className="w-5 h-5 inline mr-2" /> SERIES TRUYỀN HÌNH</Tab>
                       </Tab.List>
                       <Tab.Panels>
                          <Tab.Panel className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-10">
                             {details?.movie_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 48).map((m: any, idx: number) => (<MovieCardComponent key={idx} item={m} isTv={false} index={idx} />))}
                          </Tab.Panel>
                          <Tab.Panel className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-10">
                             {details?.tv_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 48).map((m: any, idx: number) => (<MovieCardComponent key={idx} item={m} isTv={true} index={idx} />))}
                          </Tab.Panel>
                       </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>

                {/* Footer */}
                <div className="glass-pro border-t border-white/5 p-6 sm:p-8 flex items-center justify-between mt-auto">
                   <div className="flex items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-[0.2em] italic">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Info className="w-5 h-5" /></div>
                      <div className="space-y-0.5"><span className="block text-white/60">Hồ Sơ Diễn Viên JAVDB</span><span className="block">Dữ liệu được đồng bộ hóa từ máy chủ Proxy JAVDB</span></div>
                   </div>
                   <div className="hidden sm:flex items-center gap-4"><span className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] italic leading-none whitespace-nowrap">ACTIVE SYNC 2.026</span></div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed bottom-10 right-8 z-[3000] p-6 rounded-[32px] glass-pro shadow-cinematic-2xl border border-white/10 flex flex-col gap-4 max-w-sm backdrop-blur-3xl">
             <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>{toast.type === 'error' ? <X className="w-6 h-6" /> : <Search className="w-6 h-6 animate-pulse" />}</div>
                <div className="space-y-1"><p className="text-base font-black text-white italic uppercase tracking-tight leading-none">{toast.message}</p>{toast.submessage && <p className="text-[10px] text-white/40 font-black uppercase tracking-widest italic">{toast.submessage}</p>}</div>
             </div>
             <button onClick={() => setToast(null)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-20 focus:outline-none" onClick={() => setLightboxImage(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative max-w-full max-h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain" />
              <button onClick={() => setLightboxImage(null)} className="absolute top-6 right-6 p-4 rounded-2xl bg-black/40 text-white hover:bg-primary transition-all backdrop-blur-xl border border-white/10 active-depth"><X className="w-8 h-8 stroke-[3px]" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Full JAVDB actress data: real name, measurements, height, gallery, complete filmography, codes, rating + direct JAVDB links + preview images */}
    </Transition.Root>
  );
}
