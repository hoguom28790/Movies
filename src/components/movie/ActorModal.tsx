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

export function ActorModal({ isOpen, onClose, actor, isTopXX = false }: ActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState<string | null>(null);

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor", actor?.id],
    queryFn: () => actor ? getTMDBActorDetails(actor.id) : null,
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error"; link?: string } | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Check favorite status when modal opens
  useEffect(() => {
    const checkFav = async () => {
      if (user?.uid && actor?.id) {
        const { isFavoriteActor } = await import("@/services/db");
        const status = await isFavoriteActor(user.uid, actor.id);
        setIsFav(status);
      }
    };
    if (isOpen) {
      checkFav();
    }
  }, [user?.uid, actor?.id, isOpen]);

  // Auto-hide toast
  useEffect(() => {
    if (toast && toast.type === 'info') {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^\w\s]/g, "") 
      .replace(/\s+/g, " ") 
      .replace(/(phan|part|season|tap)\s*\d+/gi, "") 
      .trim();
  };

  const handleMovieClick = async (title: string, year: string, tmdbId: number, isTv: boolean) => {
    try {
      setIsSearching(title);
      setToast({ message: `Đang kết nối: ${title} (${year})...`, type: "info" });
      
      const cleanTitle = title.replace(/\(Part\s+\d+\)/gi, "").replace(/\(Phần\s+\d+\)/gi, "").trim();
      const normalizedTitle = normalize(cleanTitle);
      
      let match = null;

      if (isTopXX) {
         const { searchTopXXMovies } = await import("@/services/api/topxx");
         const searchResult = await searchTopXXMovies(cleanTitle);
         
         const findMatch = (items: any[]) => {
            return items.find((item: any) => {
              const itemTitle = normalize(item.title);
              const itemOrigin = normalize(item.originalTitle || "");
              return (itemTitle === normalizedTitle || itemOrigin === normalizedTitle);
            }) || items[0];
          };

          match = searchResult.items.length > 0 ? findMatch(searchResult.items) : null;
          
          if (match) {
             setToast(null);
             onClose();
             router.push(`/v2k9r5w8m3x7n1p4q0z6/phim/${match.slug}`);
             return;
          }
      } else {
         let searchResult = await searchMovies(cleanTitle);

         if (searchResult.items.length === 0 && normalizedTitle !== cleanTitle.toLowerCase()) {
           searchResult = await searchMovies(normalizedTitle);
         }

         const findMatch = (items: any[]) => {
            return items.find((item: any) => {
              const itemTitle = normalize(item.title);
              const itemOrigin = normalize(item.originalTitle || "");
              const yearDiff = Math.abs(parseInt(item.year) - parseInt(year));
              
              return (
                (itemTitle === normalizedTitle || itemOrigin === normalizedTitle) && 
                (year ? yearDiff <= 1 : true)
              );
            }) || items.find((item: any) => {
               const itemTitle = normalize(item.title);
               const itemOrigin = normalize(item.originalTitle || "");
               return itemTitle.includes(normalizedTitle) || itemOrigin.includes(normalizedTitle);
            }) || items[0];
          };

          match = searchResult.items.length > 0 ? findMatch(searchResult.items) : null;

          if (match) {
            setToast(null);
            onClose();
            router.push(`/phim/${match.slug}`);
            return;
          }
      }
        setToast({ 
          message: "Tác phẩm này hiện chưa có bản Pro Max.", 
          submessage: "Hệ thống đang cập nhật, bạn có thể xem kho phim chính.",
          type: "error",
          link: `https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${tmdbId}`
        });
    } catch (error) {
       setToast({ message: "Giao thức tìm kiếm bị gián đoạn. Thử lại sau.", type: "error" });
    } finally {
      setIsSearching(null);
    }
  };

  const MovieCard = ({ item, isTv, index }: { item: any; isTv: boolean; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      onClick={() => handleMovieClick(item.title || item.name, (item.release_date || item.first_air_date)?.split("-")[0], item.id, isTv)}
      className="group relative flex flex-col gap-4 text-left outline-none focus:ring-4 focus:ring-primary/20 rounded-[32px] overflow-hidden select-none active-depth"
    >
      <div className="relative aspect-[2/3] rounded-[28px] overflow-hidden bg-[#141416] shadow-cinematic-xl border border-white/5">
        <img
          src={getTMDBImageUrl(item.poster_path, 'w342') || "/placeholder-poster.png"}
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-50 group-hover:rotate-[-1deg]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-cinematic-lg group-hover:scale-110 transition-transform duration-500">
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
             </div>
             <div className="space-y-0.5">
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic drop-shadow-md">Unlock Now</span>
                <span className="block text-[12px] font-black uppercase tracking-[0.1em] text-white italic drop-shadow-md">XEM NGAY</span>
             </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 px-3 py-1.5 glass-pro rounded-xl flex items-center gap-1.5 shadow-2xl border border-white/10">
          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
          <span className="text-[12px] font-black text-white">{item.vote_average?.toFixed(1) || "9.5"}</span>
        </div>
      </div>
      
      <div className="space-y-1 px-2 transition-transform duration-500 group-hover:translate-x-1">
        <h5 className="text-[15px] font-black text-white group-hover:text-primary transition-colors line-clamp-1 italic uppercase tracking-tight font-headline">
          {item.title || item.name}
        </h5>
        <div className="flex items-center justify-between text-[11px] text-white/30 font-black uppercase tracking-widest italic overflow-hidden">
          <span className="line-clamp-1">{item.character || "N/A"}</span>
          <span className="flex-shrink-0 text-primary/60 ml-2">{(item.release_date || item.first_air_date)?.split("-")[0]}</span>
        </div>
      </div>

      <AnimatePresence>
        {isSearching === (item.title || item.name) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/20 backdrop-blur-xl flex flex-col items-center justify-center z-50 rounded-[32px] gap-4"
          >
             <div className="w-14 h-14 border-4 border-white/10 border-t-primary rounded-full animate-spin shadow-[0_0_20px_var(--primary)]" />
             <span className="text-[10px] font-bold text-white uppercase tracking-[0.4em] italic animate-pulse">Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-700"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-3xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto pt-safe pb-safe">
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-800 spring-3"
              enterFrom="opacity-0 translate-y-64 rotate-x-12 scale-90 blur-xl"
              enterTo="opacity-100 translate-y-0 rotate-x-0 scale-100 blur-0"
              leave="ease-in duration-500 spring-low"
              leaveFrom="opacity-100 translate-y-0 scale-100 blur-0"
              leaveTo="opacity-0 translate-y-64 scale-90 blur-xl"
            >
              <Dialog.Panel className="relative w-full max-w-7xl transform overflow-hidden bg-[#0a0a0b] text-left transition-all sm:rounded-[64px] border border-white/5 shadow-cinematic-2xl flex flex-col h-[100vh] sm:h-[90vh] perspective-1000">
                
                {/* Neural Header Architecture */}
                <div className="relative h-[350px] sm:h-[500px] flex-shrink-0 bg-cover bg-center overflow-hidden" 
                     style={{ backgroundImage: details?.movie_credits?.cast[0]?.backdrop_path ? `url(${getTMDBImageUrl(details.movie_credits.cast[0].backdrop_path, 'original')})` : 'none' }}>
                  
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                  
                  <button onClick={onClose} className="absolute top-8 right-8 p-5 rounded-[24px] glass-pro text-white hover:bg-primary hover:scale-110 active-depth transition-all z-30 border border-white/10 group">
                    <X className="w-8 h-8 stroke-[3px] group-hover:rotate-90 transition-transform duration-500" />
                  </button>

                  <div className="absolute bottom-0 left-0 w-full p-10 sm:p-20 flex flex-col sm:flex-row items-end gap-10">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
                      className="w-48 h-48 sm:w-64 sm:h-64 rounded-[56px] overflow-hidden border-[12px] border-[#0a0a0b] shadow-cinematic-2xl flex-shrink-0 relative group ring-1 ring-white/10"
                    >
                       <img 
                         src={getTMDBImageUrl(actor?.profile_path || null, 'w500') || ""} 
                         alt={actor?.name}
                         className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2"
                       />
                       
                       <button 
                         onClick={async (e) => {
                           e.stopPropagation();
                           if (!user?.uid || !actor) return;
                           const { toggleFavoriteActor } = await import("@/services/db");
                           const isNowFav = await toggleFavoriteActor(user.uid, {
                             id: actor.id,
                             name: actor.name,
                             profilePath: actor.profile_path
                           });
                           setIsFav(isNowFav);
                           setToast({ 
                             message: isNowFav ? `Đã lưu hồ sơ: ${actor.name}` : `Đã gỡ hồ sơ: ${actor.name}`, 
                             type: "info" 
                           });
                         }}
                         className={`absolute bottom-6 right-6 p-5 rounded-[24px] backdrop-blur-3xl border border-white/20 transition-all shadow-cinematic-xl z-20 hover:scale-125 active-depth ${isFav ? 'text-red-500 bg-red-500/20' : 'text-white bg-black/40 hover:text-red-500'}`}
                       >
                          <Heart className="w-8 h-8" fill={isFav ? "currentColor" : "none"} strokeWidth={3} />
                       </button>
                    </motion.div>
                    
                    <div className="flex-grow space-y-6">
                       <div className="flex flex-col gap-2">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-2 px-4 py-1.5 glass-pro rounded-full self-start border border-white/10"
                          >
                             <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic">Elite Actor Profile</span>
                          </motion.div>
                          <motion.h3 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-5xl sm:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl uppercase leading-[0.85] font-headline skew-x-[-2deg]"
                          >
                             {actor?.name}
                          </motion.h3>
                       </div>
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-wrap gap-5">
                          <span className="px-6 py-2.5 rounded-2xl bg-primary text-white text-[11px] font-black tracking-[0.25em] uppercase shadow-cinematic-lg italic border border-primary/20">THEO DÕI NGAY</span>
                          <span className="px-6 py-2.5 rounded-2xl glass-pro text-white/60 text-[11px] font-black tracking-[0.2em] uppercase italic border border-white/10">
                            {details ? `${details.movie_credits?.cast?.length + (details.tv_credits?.cast?.length || 0)} ARCHIVES FOUND` : "LOADING DATA..."}
                          </span>
                       </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto px-10 sm:px-20 py-12 no-scrollbar scroll-smooth">
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10">
                       {[...Array(12)].map((_, i) => (
                         <div key={i} className="space-y-5 animate-pulse">
                            <div className="aspect-[2/3] bg-white/5 rounded-[40px]" />
                            <div className="h-6 bg-white/5 rounded-xl w-4/5" />
                            <div className="h-4 bg-white/5 rounded-xl w-3/5" />
                         </div>
                       ))}
                    </div>
                  ) : (
                    <Tab.Group>
                       <Tab.List className="flex gap-12 border-b border-white/5 mb-12 overflow-x-auto pb-1 no-scrollbar sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-3xl z-40 py-4">
                          <Tab className={({ selected }) => `group/tab pb-6 text-[14px] font-black tracking-[0.3em] outline-none transition-all uppercase italic flex-shrink-0 flex items-center gap-4 ${selected ? "text-primary border-b-[6px] border-primary" : "text-white/20 hover:text-white/60" }`}>
                            {({ selected }) => (
                               <div className="flex items-center gap-4">
                                  <Film className={`w-6 h-6 transition-transform group-hover/tab:-rotate-12 ${selected ? "animate-pulse" : ""}`} /> CINEMA PROJECTS
                               </div>
                            )}
                          </Tab>
                          <Tab className={({ selected }) => `group/tab pb-6 text-[14px] font-black tracking-[0.3em] outline-none transition-all uppercase italic flex-shrink-0 flex items-center gap-4 ${selected ? "text-primary border-b-[6px] border-primary" : "text-white/20 hover:text-white/60" }`}>
                            {({ selected }) => (
                               <div className="flex items-center gap-4">
                                  <Tv className={`w-6 h-6 transition-transform group-hover/tab:rotate-12 ${selected ? "animate-pulse" : ""}`} /> SERIES LEGACY
                               </div>
                            )}
                          </Tab>
                       </Tab.List>
                       <Tab.Panels className="focus:outline-none">
                          <Tab.Panel className="focus:outline-none">
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-16">
                                {details?.movie_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 48).map((m: any, idx: number) => (
                                  <MovieCard key={`${m.id}-${idx}`} item={m} isTv={false} index={idx} />
                                ))}
                             </div>
                          </Tab.Panel>
                          <Tab.Panel className="focus:outline-none">
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-16">
                                {details?.tv_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 48).map((m: any, idx: number) => (
                                  <MovieCard key={`${m.id}-${idx}`} item={m} isTv={true} index={idx} />
                                ))}
                             </div>
                          </Tab.Panel>
                       </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>

                {/* Intelligent Footer Control */}
                <div className="glass-pro border-t border-white/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-8 z-50">
                   <div className="flex items-center gap-6 text-[11px] text-white/30 font-black uppercase tracking-[0.3em] italic">
                      <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-primary/20 shadow-inner">
                        <Info className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                         <span className="block text-white/60">Pro Max Interface Protocol</span>
                         <span className="block">Bấm vào tác phẩm để tìm thấy bản phát hành cao cấp nhất</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3 px-5 py-2 glass-pro rounded-xl border border-white/10">
                         <TrendingUp className="w-4 h-4 text-green-500" />
                         <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic leading-none">Popularity Ranking Active</span>
                      </div>
                      <span className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] italic">Data Sync v.2.026</span>
                   </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 50, scale: 0.95, filter: "blur(10px)" }}
            className={`fixed bottom-10 right-8 sm:right-12 z-[3000] p-8 rounded-[40px] glass-pro shadow-cinematic-2xl border border-white/10 flex flex-col gap-5 w-[calc(100vw-64px)] sm:max-w-md backdrop-blur-3xl`}
          >
             <div className="flex items-start gap-5">
                <div className={`p-5 rounded-2xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                  {toast.type === 'error' ? <X className="w-7 h-7 stroke-[3px]" /> : <Search className="w-7 h-7 stroke-[3px] animate-pulse" />}
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-lg font-black text-white italic uppercase tracking-tight leading-none shadow-2xl">{toast.message}</p>
                  {toast.submessage && <p className="text-[12px] text-white/40 font-black uppercase tracking-widest italic">{toast.submessage}</p>}
                </div>
             </div>
             
             {toast.link && (
                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={toast.link} 
                  target="_blank" 
                  className="ml-16 py-4 px-8 rounded-2xl bg-white/5 hover:bg-primary hover:text-white text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 italic border border-white/5"
                >
                   EXTERNAL PROFILE <ChevronRight className="w-4 h-4" />
                </motion.a>
             )}
             
             <button onClick={() => setToast(null)} className="absolute top-8 right-8 p-2 text-white/20 hover:text-white transition-colors active-depth">
                <X className="w-6 h-6" />
             </button>
             
             {/* Progress indicator for toast */}
             {toast.type === 'info' && (
                <div className="absolute bottom-4 left-16 right-16 h-1 bg-white/5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }} className="h-full bg-primary" />
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </Transition.Root>
  );
}


// Click actor image → TMDB movie_credits/tv_credits modal → search site's API by title+year → navigate to /phim/[slug]
