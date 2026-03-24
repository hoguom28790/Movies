// FIXED TopXX actress data using JavLibrary primary + JAVDB fallback + full fields: real name, measurements, height, gallery, filmography with codes & previews
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, Film, Tv, Info, Search, ChevronRight, Heart, Sparkles, TrendingUp, ExternalLink, Image as ImageIcon, MapPin, Ruler, User, Smile } from "lucide-react";
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
    queryKey: ["actor-javlib", actor?.name?.toLowerCase(), isTopXX],
    queryFn: async () => {
      if (!actor) return null;
      if (isTopXX) {
        try {
          // Fetch from the robust JavLibrary + Fallbacks proxy
          const detailRes = await fetch(`/api/javlibrary/actress/${encodeURIComponent(actor.name)}`);
          if (!detailRes.ok) throw new Error("Could not retrieve profile metadata");
          const detailData = await detailRes.json();
          return detailData as JAVLibraryActress;
        } catch (err) {
          console.error("JAVLIB Fetch Error:", err);
          setToast({ 
             message: "Truy xuất JavLibrary thất bại", 
             submessage: "Đang thử nghiệm giao thức dự phòng JAVDB...", 
             type: "error" 
          });
          return null;
        }
      }
      return getTMDBActorDetails(actor.id as number);
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
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
              <Dialog.Panel className="relative w-full h-[100vh] sm:h-[90vh] max-w-7xl transform bg-[#0a0a0b] text-left transition-all sm:rounded-[48px] border border-white/5 shadow-cinematic-2xl flex flex-col overflow-hidden">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-4 rounded-3xl glass-pro text-white hover:text-primary z-[100] border border-white/10 active-depth transition-all shadow-2xl">
                  <X className="w-6 h-6 stroke-[3px]" />
                </button>

                <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                    {/* Hero Section */}
                    <div className="relative h-[350px] sm:h-[550px] bg-cover bg-center" 
                         style={{ backgroundImage: `url(${isTopXX ? (details as any)?.profileImage : getTMDBImageUrl(profilePath, 'original')})` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 w-full p-8 sm:p-16 md:p-20 flex flex-col sm:flex-row items-end gap-10 sm:gap-14">
                        <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-[56px] overflow-hidden border-[10px] border-[#0a0a0b] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex-shrink-0 relative group">
                           <img src={isTopXX ? (details as any)?.profileImage : (getTMDBImageUrl(profilePath, 'w500') || "/placeholder-actor.png")} alt={actor?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-2000" />
                        </div>
                        <div className="space-y-6 pb-6">
                           <div className="space-y-2">
                             {(details as any)?.studio && <span className="text-[12px] font-black text-primary uppercase italic tracking-[0.4em]">{(details as any).studio} ELITE</span>}
                             <h3 className="text-5xl sm:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] font-headline drop-shadow-2xl">{actor?.name}</h3>
                           </div>
                           <div className="flex flex-wrap gap-5 items-center">
                              <span className="px-6 py-3 rounded-2xl bg-primary text-white text-[11px] font-black tracking-widest uppercase italic border border-primary/20 shadow-[0_10px_40px_rgba(59,130,246,0.3)]">PRIMARY ARTIST</span>
                              {isTopXX && (
                                <span className={`px-6 py-3 rounded-2xl bg-yellow-500/10 text-yellow-500 text-[11px] font-black tracking-widest uppercase italic border border-yellow-500/20`}>
                                  {(details as any)?.source === "javlibrary" ? "JAVLIBRARY SYNCED" : "JAVDB FALLBACK"}
                                </span>
                              )}
                              
                              <button 
                                onClick={handleToggleFav}
                                className={`p-4 rounded-2xl border transition-all active-depth ${isFav ? 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg shadow-red-500/40' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                              >
                                <Heart className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabs / Content Section */}
                    <div className="px-8 sm:px-16 md:px-24 py-12">
                      {isLoading ? (
                         <div className="space-y-12 py-10">
                            <div className="flex gap-12 border-b border-white/5 pb-8">
                               {[1,2,3].map(i => <div key={i} className="w-40 h-8 bg-white/5 animate-pulse rounded-full" />)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                               <div className="space-y-10">{[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-3xl" />)}</div>
                               <div className="aspect-[4/5] bg-white/5 animate-pulse rounded-[64px]" />
                            </div>
                         </div>
                      ) : details ? (
                        <Tab.Group>
                          <Tab.List className="flex gap-14 border-b border-white/5 mb-14 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur-3xl z-[60] py-8 transition-all -mx-8 sm:-mx-16 md:-mx-24 px-8 sm:px-16 md:px-24 shadow-2xl">
                            {["THÔNG TIN CÁ NHÂN", "BỘ SƯU TẬP (GALLERY)", "DANH SÁCH TÁC PHẨM"].map((name) => (
                               <Tab key={name} className={({ selected }) => `pb-8 text-[13px] sm:text-[15px] font-black tracking-[0.3em] outline-none uppercase italic transition-all relative ${selected ? "text-primary" : "text-white/20 hover:text-white"}`}>
                                 {({ selected }) => (
                                   <>
                                     {name}
                                     {selected && <motion.div layoutId="activeActorTab" className="absolute bottom-0 left-0 right-0 h-[5px] bg-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]" />}
                                   </>
                                 )}
                               </Tab>
                            ))}
                          </Tab.List>
                          <Tab.Panels>
                            {/* Tab 1: Personal Info */}
                            <Tab.Panel className="grid grid-cols-1 md:grid-cols-2 gap-20 focus:outline-none">
                               <div className="space-y-14">
                                  <div className="space-y-4">
                                    <h4 className="text-[12px] font-black text-primary uppercase tracking-[0.6em] italic opacity-70 flex items-center gap-4">
                                      <TrendingUp className="w-5 h-5" /> BIOGRAPHICAL ARCHIVE
                                    </h4>
                                    <div className="h-1.5 w-24 bg-primary/40 rounded-full" />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                                    {[
                                      { label: "Nghệ danh", value: isTopXX ? (details as JAVLibraryActress).stageName : actor?.name, icon: User },
                                      { label: "Tên thật", value: isTopXX ? (details as JAVLibraryActress).realName : "Unknown", icon: Smile },
                                      { label: "Ngày sinh", value: isTopXX ? (details as JAVLibraryActress).birthDate : (details as any).birthday, icon: Calendar },
                                      { label: "Số đo 3 vòng", value: isTopXX ? (details as JAVLibraryActress).measurements : "Hidden", icon: Ruler },
                                      { label: "Chiều cao", value: isTopXX ? (details as JAVLibraryActress).height : "N/A", icon: Ruler },
                                      { label: "Quê quán", value: isTopXX ? (details as JAVLibraryActress).birthPlace : (details as any).place_of_birth, icon: MapPin },
                                      { label: "Studio", value: (details as any).studio || "Internal", icon: Tv },
                                      { label: "Năm Debut", value: (details as any).debutYear || "N/A", icon: Play },
                                      { label: "Trạng thái", value: (details as any).status || "Active", icon: TrendingUp }
                                    ].map((stat, i) => (
                                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} key={i} className="flex flex-col gap-3 group">
                                         <div className="flex items-center gap-3">
                                            <stat.icon className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
                                            <span className="text-[11px] text-white/20 font-black uppercase tracking-widest italic">{stat.label}</span>
                                         </div>
                                         <span className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-primary transition-colors duration-500">{stat.value || "Protected"}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                               </div>
                               
                               <div className="space-y-10">
                                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group aspect-[4/5] rounded-[64px] overflow-hidden border border-white/5 shadow-cinematic-2xl self-start">
                                    <img src={(isTopXX ? (details as JAVLibraryActress).profileImage : getTMDBImageUrl(profilePath, 'original')) || ""} className="w-full h-full object-cover transition-all duration-3000 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-12 translate-y-6 group-hover:translate-y-0 transition-all duration-700">
                                       <div className="glass-pro p-8 rounded-[36px] border border-white/10 w-full flex items-center justify-between shadow-2xl">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black text-white/30 uppercase italic tracking-widest">Protocol Verification</span>
                                            <span className="text-xl font-black text-white italic uppercase tracking-tighter">OFFICIAL JAVLIB PROFILE</span>
                                          </div>
                                          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                       </div>
                                    </div>
                                 </motion.div>
                                 
                                 <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-4">
                                       <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                       <span className="text-[11px] font-black text-white/30 uppercase italic tracking-widest">Live Sync Status: 100%</span>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-primary/40" />
                                 </div>
                               </div>
                            </Tab.Panel>

                            {/* Tab 2: Gallery */}
                            <Tab.Panel className="focus:outline-none">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10">
                                  {isTopXX ? (
                                    (details as JAVLibraryActress).gallery.length > 0 ? (
                                      (details as JAVLibraryActress).gallery.map((img: string, i: number) => (
                                        <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} onClick={() => setLightboxImage(img)} className="group relative aspect-square rounded-[40px] overflow-hidden border border-white/5 active-depth shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/[0.02]">
                                           <img src={img} className="w-full h-full object-cover group-hover:scale-115 transition-all duration-1000 group-hover:brightness-50" />
                                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <ImageIcon className="w-10 h-10 text-white scale-125" />
                                           </div>
                                        </motion.button>
                                      ))
                                    ) : (
                                       <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-8">
                                          <ImageIcon className="w-24 h-24 text-primary/40" />
                                          <div className="space-y-4">
                                            <p className="text-2xl tracking-[0.2em]">Gallery Data Synchronizing...</p>
                                            <p className="text-sm tracking-widest">Enriching via JAVDB Fallback protocol</p>
                                          </div>
                                       </div>
                                    )
                                  ) : (
                                    <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-6">
                                       <ImageIcon className="w-20 h-20" />
                                       <p className="text-xl">Gallery exclusive to JAV Elites.</p>
                                    </div>
                                  )}
                                </div>
                            </Tab.Panel>

                            {/* Tab 3: Filmography */}
                            <Tab.Panel className="focus:outline-none pb-24">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-14">
                                  {isTopXX ? (
                                    (details as JAVLibraryActress).filmography.map((m: any, i: number) => (
                                      <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group flex flex-col gap-5">
                                         <div className="relative aspect-[2/3] rounded-[42px] overflow-hidden bg-black border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.7)] group-hover:shadow-primary/20 transition-all duration-500">
                                            <img src={m.poster} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-1500 group-hover:brightness-[0.25]" />
                                            
                                            <div className="absolute inset-0 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-700 gap-5 translate-y-6 group-hover:translate-y-0 backdrop-blur-[2px]">
                                               <button onClick={() => handleMovieClick(m.title, m.year, m.code)} className="w-full py-5 bg-primary text-[12px] font-black text-white uppercase italic rounded-[24px] flex items-center justify-center gap-4 shadow-2xl active-depth hover:bg-[#2563eb] transition-all hover:scale-[1.05]"><Play className="w-6 h-6 fill-current" /> XEM NGAY</button>
                                               <a href={`https://www.javlibrary.com/en/?v=${m.code.replace(/[-\s]/g, "").toLowerCase()}`} target="_blank" className="w-full py-4 glass-pro border border-white/10 text-[10px] font-black text-white/50 hover:text-white uppercase italic rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"><ExternalLink className="w-4 h-4" /> ON JAVLIBRARY</a>
                                            </div>
                                            
                                            <div className="absolute top-6 left-6 glass-pro px-5 py-2 rounded-2xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform"><span className="text-[12px] font-black text-primary italic uppercase tracking-widest">{m.code}</span></div>
                                            
                                            {m.rating !== "N/A" && (
                                              <div className="absolute top-6 right-6 bg-yellow-500/10 backdrop-blur-2xl px-3 py-1.5 rounded-2xl border border-yellow-500/20 shadow-2xl flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="text-[12px] font-black text-yellow-500">{m.rating}</span>
                                              </div>
                                            )}
                                         </div>
                                         <div className="px-3 space-y-2.5">
                                            <h5 className="text-[15px] font-black text-white line-clamp-2 italic uppercase font-headline tracking-tight group-hover:text-primary transition-colors leading-tight h-12">{m.title}</h5>
                                            <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase italic tracking-widest">
                                              <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary/30" /> {m.year || "LATEST"}</span>
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5">ULTRA HD</span>
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
                        <div className="flex flex-col items-center justify-center py-40 gap-8 opacity-30 italic font-black uppercase tracking-[0.3em] text-center max-w-xl mx-auto">
                           <TrendingUp className="w-24 h-24 mb-6 text-primary animate-bounce opacity-20" />
                           <p className="text-3xl leading-relaxed">System protocols synchronization in progress</p>
                           <p className="text-sm font-medium tracking-[0.4em] text-white/40">The JAVLibrary matrix is realigning. Expected throughput restoration shortly.</p>
                        </div>
                      )}
                    </div>

                    {/* Footer System Stats */}
                    <div className="border-t border-white/5 p-16 mb-safe flex flex-col md:flex-row items-center justify-between gap-12 bg-gradient-to-t from-primary/5 to-transparent">
                       <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-2xl"><Info className="w-10 h-10" /></div>
                          <div className="space-y-2">
                             <span className="block text-[12px] text-white/30 font-black uppercase tracking-[0.4em] italic leading-none">Intelligence Engine 3.1.2</span>
                             <span className="block text-2xl font-black text-white italic uppercase tracking-tighter">ELITE PRIMARY SYNC ACTIVE</span>
                          </div>
                       </div>
                       <div className="flex gap-14">
                          {[
                            { label: "Stability Index", val: "99.9%" },
                            { label: "Data Enrichment", val: "JAVLib+JDB" },
                            { label: "Matrix State", val: "Verified" }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center sm:items-end gap-1">
                               <span className="text-[11px] text-white/10 font-black uppercase tracking-widest italic">{item.label}</span>
                               <span className="text-2xl font-black text-white italic tracking-tighter">{item.val}</span>
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
      
      {/* Toast Notification - Neural Class */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} className="fixed bottom-12 right-12 z-[3000] p-10 rounded-[48px] glass-pro shadow-[0_50px_120px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col gap-8 max-w-md backdrop-blur-3xl">
             <div className="flex items-start gap-8">
                <div className={`p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>{toast.type === 'error' ? <X className="w-10 h-10" /> : <Search className="w-10 h-10 animate-pulse" />}</div>
                <div className="space-y-2 pt-1.5 min-w-0 flex-1">
                   <p className="text-2xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">{toast.message}</p>
                   {toast.submessage && <p className="text-[12px] text-white/40 font-black uppercase tracking-[0.1em] italic leading-relaxed">{toast.submessage}</p>}
                </div>
             </div>
             <button onClick={() => setToast(null)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"><X className="w-7 h-7 stroke-[3px]" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox - Cinematic Neural */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] bg-black/98 backdrop-blur-[120px] flex items-center justify-center p-6 sm:p-24" onClick={() => setLightboxImage(null)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", damping: 35, stiffness: 250 }} className="relative w-full max-w-6xl h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
               <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-[64px] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/10" />
               <button onClick={() => setLightboxImage(null)} className="absolute top-0 -right-6 sm:-right-24 p-8 rounded-full glass-pro text-white hover:bg-[#ef4444] transition-all shadow-2xl border border-white/10 active-depth"><X className="w-12 h-12 stroke-[4px]" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Transition.Root>
  );
}
