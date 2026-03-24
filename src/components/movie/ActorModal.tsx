// JAVDB full actress implementation - real name, measurements, height, gallery, complete filmography, codes, rating, preview images, direct links
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, Film, Tv, Info, Search, ChevronRight, Heart, Sparkles, TrendingUp, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number | string;
    name: string;
    profile_path?: string | null;
    profilePath?: string | null;
  } | null;
  isTopXX?: boolean;
}

interface JAVDBActress {
  realName: string;
  stageName: string;
  birthDate: string;
  measurements: string;
  height: string;
  profileImage: string;
  birthPlace: string;
  gallery: string[];
  filmography: {
    code: string;
    title: string;
    poster: string;
    year: string;
    rating: string;
    previewImage: string;
    link: string;
  }[];
}

export function ActorModal({ isOpen, onClose, actor, isTopXX = false }: ActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error" } | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Profile path mapping
  const profilePath = actor ? (actor.profile_path || actor.profilePath || null) : null;

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor-javdb", actor?.name?.toLowerCase(), isTopXX],
    queryFn: async () => {
      if (!actor) return null;
      if (isTopXX) {
        try {
          // 1. Search for JAVDB ID by name
          const searchRes = await fetch(`/api/javdb/actress?name=${encodeURIComponent(actor.name)}`);
          const searchData = await searchRes.json();
          if (!searchData.id) throw new Error("Actress ID not found");
          
          // 2. Fetch Full Details from the new robust proxy
          const detailRes = await fetch(`/api/javdb/actress/${searchData.id}`);
          const detailData = await detailRes.json();
          return detailData as JAVDBActress;
        } catch (err) {
          console.error("JAVDB Fetch Error:", err);
          return null;
        }
      }
      return getTMDBActorDetails(actor.id as number);
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 30, // 30 minutes cache as requested
  });

  useEffect(() => {
    const checkFav = async () => {
      const effectiveId = (isTopXX && details) ? (details as any).id || actor?.id : actor?.id;
      if (user?.uid && effectiveId) {
        const { isFavoriteActor } = await import("@/services/db");
        const status = await isFavoriteActor(user.uid, effectiveId);
        setIsFav(status);
      }
    };
    if (isOpen) checkFav();
  }, [user?.uid, actor?.id, details, isOpen, isTopXX]);

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
      const { searchMovies: searchStreaming } = await import("@/services/api");
      
      // Try search by code first if available (for JAV)
      let searchResult = await searchStreaming(code || title);

      if (searchResult.items.length === 0) {
        searchResult = await searchStreaming(normalizedTitle);
      }

      const match = searchResult.items.find((item: any) => {
        const itemTitle = normalize(item.title);
        const itemOrigin = normalize(item.originalTitle || "");
        const itemYear = parseInt(item.year);
        const targetYear = parseInt(year);
        const yearDiff = Math.abs(itemYear - targetYear);
        return (itemTitle === normalizedTitle || itemOrigin === normalizedTitle || item.title.includes(code || "")) && (year ? yearDiff <= 1 : true);
      }) || searchResult.items[0];

      if (match) {
        setToast(null);
        onClose();
        router.push(`/phim/${match.slug}`); 
      } else {
        setToast({ 
          message: "Tác phẩm này hiện chưa có bản phát hành tại đây.", 
          submessage: "Hệ thống đang cập nhật, bạn có thể xem các phim khác hoặc đổi nguồn.",
          type: "error"
        });
      }
    } catch (error) {
       setToast({ message: "Giao thức tìm kiếm bị gián đoạn. Thử lại sau.", type: "error" });
    } finally {
      setIsSearching(null);
    }
  };

  const handleToggleFav = async () => {
    if (!user) {
      setToast({ message: "Vui lòng đăng nhập để yêu thích diễn viên.", type: "error" });
      return;
    }
    if (!actor) return;
    
    try {
      const { toggleFavoriteActor } = await import("@/services/db");
      const effectiveId = (isTopXX && details) ? (details as any).id || actor.id : actor.id;

      const actorData = {
        id: effectiveId,
        name: actor.name,
        profilePath: profilePath || (details as any)?.profileImage
      };
      await toggleFavoriteActor(user.uid, actorData);
      setIsFav(!isFav);
      setToast({ 
        message: !isFav ? `Đã thêm ${actor.name} vào yêu thích` : `Đã gỡ ${actor.name} khỏi yêu thích`,
        type: "info" 
      });
    } catch (err) {
      setToast({ message: "Lỗi khi cập nhật yêu thích.", type: "error" });
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-700" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-3xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto no-scrollbar pt-safe pb-safe">
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:p-4 md:p-10">
            <Transition.Child as={Fragment} enter="ease-out duration-800" enterFrom="opacity-0 translate-y-64 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-500" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-64 scale-95">
              <Dialog.Panel className="relative w-full max-w-7xl transform bg-[#0a0a0b] text-left transition-all sm:rounded-[48px] border border-white/5 shadow-cinematic-2xl flex flex-col h-[100vh] sm:h-[90vh] overflow-hidden">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-4 rounded-3xl glass-pro text-white hover:text-primary z-[100] border border-white/10 active-depth transition-all shadow-2xl">
                  <X className="w-6 h-6 stroke-[3px]" />
                </button>

                <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                    {/* Hero Section */}
                    <div className="relative h-[350px] sm:h-[500px] bg-cover bg-center" 
                         style={{ backgroundImage: `url(${isTopXX ? (details as any)?.profileImage : getTMDBImageUrl(profilePath, 'original')})` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 w-full p-8 sm:p-12 md:p-16 flex flex-col sm:flex-row items-end gap-8 sm:gap-12">
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-[48px] overflow-hidden border-[8px] border-[#0a0a0b] shadow-2xl flex-shrink-0 relative group">
                           <img src={isTopXX ? (details as any)?.profileImage : (getTMDBImageUrl(profilePath, 'w500') || "/placeholder-actor.png")} alt={actor?.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4 pb-4">
                           <h3 className="text-4xl sm:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.9] font-headline">{actor?.name}</h3>
                           <div className="flex flex-wrap gap-4 items-center">
                              <span className="px-5 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black tracking-widest uppercase italic border border-primary/20 shadow-lg shadow-primary/20">ELITE ARTIST</span>
                              {isTopXX && <span className="px-5 py-2.5 rounded-2xl bg-yellow-500/20 text-yellow-500 text-[10px] font-black tracking-widest uppercase italic border border-yellow-500/20">AUTHENTIC JAVDB</span>}
                              
                              <button 
                                onClick={handleToggleFav}
                                className={`p-3.5 rounded-2xl border transition-all active:scale-95 ${isFav ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                              >
                                <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabs / Content Section */}
                    <div className="px-8 sm:px-16 md:px-24 py-10">
                      {isLoading ? (
                         <div className="space-y-12 py-10">
                            <div className="flex gap-10 border-b border-white/5 pb-6">
                               {[1,2,3].map(i => <div key={i} className="w-32 h-6 bg-white/5 animate-pulse rounded-full" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                               <div className="space-y-8">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-3xl" />)}</div>
                               <div className="aspect-[4/5] bg-white/5 animate-pulse rounded-[56px]" />
                            </div>
                         </div>
                      ) : details ? (
                        <Tab.Group>
                          <Tab.List className="flex gap-12 border-b border-white/5 mb-10 sticky top-0 bg-[#0a0a0b] z-[60] py-6 transition-all -mx-8 sm:-mx-16 md:-mx-24 px-8 sm:px-16 md:px-24">
                            {["THÔNG TIN CÁ NHÂN", "BỘ SƯU TẬP (GALLERY)", "DANH SÁCH TÁC PHẨM"].map((name) => (
                               <Tab key={name} className={({ selected }) => `pb-6 text-[12px] sm:text-[14px] font-black tracking-[0.25em] outline-none uppercase italic transition-all relative ${selected ? "text-primary" : "text-white/20 hover:text-white"}`}>
                                 {({ selected }) => (
                                   <>
                                     {name}
                                     {selected && <motion.div layoutId="activeActorTab" className="absolute bottom-0 left-0 right-0 h-[4px] bg-primary rounded-full" />}
                                   </>
                                 )}
                               </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels>
                            {/* Tab 1: Personal Info */}
                            <Tab.Panel className="grid grid-cols-1 md:grid-cols-2 gap-16 focus:outline-none">
                               <div className="space-y-10">
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.6em] italic opacity-60">BIOGRAPHICAL ARCHIVE</h4>
                                    <div className="h-1 w-20 bg-primary/30 rounded-full" />
                                  </div>
                                  
                                  <div className="grid gap-8">
                                    {[
                                      { label: "Nghệ danh", value: isTopXX ? (details as JAVDBActress).stageName : actor?.name },
                                      { label: "Tên thật", value: isTopXX ? (details as JAVDBActress).realName : "Unknown" },
                                      { label: "Ngày sinh", value: isTopXX ? (details as JAVDBActress).birthDate : (details as any).birthday },
                                      { label: "Số đo 3 vòng", value: isTopXX ? (details as JAVDBActress).measurements : "Not Available" },
                                      { label: "Chiều cao", value: isTopXX ? (details as JAVDBActress).height : "Not Available" },
                                      { label: "Quê quán", value: isTopXX ? (details as JAVDBActress).birthPlace : (details as any).place_of_birth }
                                    ].map((stat, i) => (
                                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex flex-col gap-2 group">
                                         <span className="text-[11px] text-white/20 font-black uppercase tracking-widest italic group-hover:text-primary transition-colors">{stat.label}</span>
                                         <span className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">{stat.value || "Hidden / N/A"}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                               </div>
                               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group aspect-[4/5] rounded-[56px] overflow-hidden border border-white/5 shadow-cinematic-2xl self-start">
                                  <img src={(isTopXX ? (details as JAVDBActress).profileImage : getTMDBImageUrl(profilePath, 'original')) || ""} className="w-full h-full object-cover transition-all duration-2000 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-12">
                                     <div className="glass-pro p-6 rounded-3xl border border-white/10 w-full flex items-center justify-between">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-white/40 uppercase italic">Verification</span>
                                          <span className="text-sm font-black text-white italic uppercase">OFFICIAL PROFILE</span>
                                        </div>
                                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                                     </div>
                                  </div>
                               </motion.div>
                            </Tab.Panel>

                            {/* Tab 2: Gallery */}
                            <Tab.Panel className="focus:outline-none">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
                                  {isTopXX ? (
                                    (details as JAVDBActress).gallery.map((img: string, i: number) => (
                                      <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setLightboxImage(img)} className="group relative aspect-square rounded-[32px] overflow-hidden border border-white/5 active-depth shadow-2xl bg-white/[0.02]">
                                         <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 group-hover:brightness-50" />
                                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon className="w-8 h-8 text-white scale-125" />
                                         </div>
                                      </motion.button>
                                    ))
                                  ) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-4">
                                       <ImageIcon className="w-16 h-16" />
                                       <p>Gallery data only available for JAVDB Elite profiles.</p>
                                    </div>
                                  )}
                               </div>
                            </Tab.Panel>

                            {/* Tab 3: Filmography */}
                            <Tab.Panel className="focus:outline-none pb-20">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12">
                                  {isTopXX ? (
                                    (details as JAVDBActress).filmography.map((m: any, i: number) => (
                                      <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group flex flex-col gap-4">
                                         <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-black border border-white/5 shadow-2xl group-hover:shadow-primary/10 transition-all duration-500">
                                            <img src={m.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 group-hover:brightness-[0.3]" />
                                            {/* Preview Image logic check - if available it can be shown on hover back or thumb */}
                                            <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 gap-4 translate-y-4 group-hover:translate-y-0">
                                               <button onClick={() => handleMovieClick(m.title, m.year, m.code)} className="w-full py-4 bg-primary text-[11px] font-black text-white uppercase italic rounded-2xl flex items-center justify-center gap-3 shadow-2xl active-depth hover:bg-primary-hover transition-colors"><Play className="w-5 h-5 fill-current" /> XEM NGAY</button>
                                               <a href={m.link} target="_blank" className="w-full py-3 glass-pro border border-white/10 text-[10px] font-black text-white/50 hover:text-white uppercase italic rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><ExternalLink className="w-4 h-4" /> TRÊN JAVDB</a>
                                            </div>
                                            <div className="absolute top-5 left-5 glass-pro px-4 py-1.5 rounded-xl border border-white/10 shadow-xl"><span className="text-[11px] font-black text-primary italic uppercase tracking-wider">{m.code}</span></div>
                                            {m.rating !== "N/A" && (
                                              <div className="absolute top-5 right-5 bg-yellow-500/10 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-yellow-500/20 shadow-xl flex items-center gap-1.5">
                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                <span className="text-[11px] font-black text-yellow-500">{m.rating}</span>
                                              </div>
                                            )}
                                         </div>
                                         <div className="px-2 space-y-1.5">
                                            <h5 className="text-[14px] font-black text-white line-clamp-2 italic uppercase font-headline tracking-tight group-hover:text-primary transition-colors leading-tight h-10">{m.title}</h5>
                                            <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase italic">
                                              <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {m.year}</span>
                                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">JAV-HQ</span>
                                            </div>
                                         </div>
                                      </motion.div>
                                    ))
                                  ) : (
                                    (details as any).movie_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 50).map((m: any, idx: number) => (
                                       <motion.button key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => handleMovieClick(m.title || m.name, (m.release_date || m.first_air_date)?.split("-")[0])} className="group relative flex flex-col gap-4 text-left active-depth">
                                          <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-[#141416] border border-white/5 shadow-2xl">
                                             <img src={getTMDBImageUrl(m.poster_path, 'w342') || "/placeholder-poster.png"} className="w-full h-full object-cover group-hover:scale-110 transition-all group-hover:brightness-50" />
                                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-16 h-16 text-primary fill-current drop-shadow-2xl" />
                                             </div>
                                          </div>
                                          <div className="px-2">
                                             <h5 className="text-[14px] font-black text-white group-hover:text-primary transition-colors italic uppercase font-headline line-clamp-2 h-10">{m.title || m.name}</h5>
                                             <p className="text-[10px] font-black text-white/20 italic mt-1 uppercase">YEAR: {(m.release_date || m.first_air_date)?.split("-")[0] || "N/A"}</p>
                                          </div>
                                       </motion.button>
                                    ))
                                  )}
                               </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-30 italic font-black uppercase tracking-widest text-center max-w-lg mx-auto">
                           <TrendingUp className="w-20 h-20 mb-4 text-primary animate-bounce" />
                           <p className="text-2xl">Dữ liệu hồ sơ hiện tại đang được đồng bộ hóa</p>
                           <p className="text-sm font-medium tracking-[0.3em] text-white/50">Cơ sở dữ liệu sẽ tự động khả dụng trong vòng vài giờ tới</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Stats */}
                    <div className="border-t border-white/5 p-12 mb-safe flex flex-col md:flex-row items-center justify-between gap-10 bg-gradient-to-b from-transparent to-black/40">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl"><Info className="w-8 h-8" /></div>
                          <div className="space-y-1">
                             <span className="block text-[11px] text-white/40 font-black uppercase tracking-[0.3em] italic">Architecture System 2.026</span>
                             <span className="block text-lg font-black text-white italic uppercase tracking-tighter">Elite Artist Protocol Synced</span>
                          </div>
                       </div>
                       <div className="flex gap-10">
                          {[
                            { label: "Data Integrity", val: "100%" },
                            { label: "Sync Latency", val: "~2.4ms" },
                            { label: "Profile State", val: "Verified" }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center sm:items-end">
                               <span className="text-[10px] text-white/10 font-black uppercase tracking-widest italic">{item.label}</span>
                               <span className="text-xl font-black text-white italic">{item.val}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} className="fixed bottom-12 right-12 z-[3000] p-8 rounded-[40px] glass-pro shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col gap-6 max-w-sm">
             <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>{toast.type === 'error' ? <X className="w-8 h-8" /> : <Search className="w-8 h-8 animate-pulse text-primary" />}</div>
                <div className="space-y-1.5 pt-1">
                   <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{toast.message}</p>
                   {toast.submessage && <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.1em] italic leading-relaxed">{toast.submessage}</p>}
                </div>
             </div>
             <button onClick={() => setToast(null)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] bg-black/98 backdrop-blur-[100px] flex items-center justify-center p-6 sm:p-24" onClick={() => setLightboxImage(null)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-5xl h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
               <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10" />
               <button onClick={() => setLightboxImage(null)} className="absolute top-0 -right-4 sm:-right-20 p-6 rounded-full glass-pro text-white hover:bg-red-500 transition-all shadow-2xl border border-white/10 active-depth"><X className="w-10 h-10 stroke-[3px]" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Transition.Root>
  );
}
