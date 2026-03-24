"use client";

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  X, User, Calendar, MapPin, Ruler, Smile, Tv, 
  Play, TrendingUp, Sparkles, Image as ImageIcon,
  Heart, Share2, Info, Star, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTMDBActorDetails, getTMDBImageUrl } from '@/services/tmdb';
import { useQuery } from '@tanstack/react-query';

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number | string;
    name: string;
    profile_path?: string;
    profilePath?: string;
  } | null;
  isTopXX?: boolean;
}

interface JAVDBActress {
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

export function ActorModal({ isOpen, onClose, actor, isTopXX }: ActorModalProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; submessage?: string; type: 'info' | 'error' } | null>(null);

  const profilePath = actor ? (actor.profile_path || actor.profilePath || null) : null;

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor-javdb", actor?.name?.toLowerCase(), isTopXX],
    queryFn: async () => {
      if (!actor) return null;
      if (isTopXX) {
        try {
          if (isOpen) {
             setToast({ message: "Đang truy xuất JAVDB...", submessage: `Đang kết nối profile: ${actor.name}`, type: "info" });
          }

          const detailRes = await fetch(`/api/javdb/actress/${encodeURIComponent(actor.name)}`);
          console.log(`[JAV MODAL] Fetching profile for: ${actor.name}`);
          if (!detailRes.ok) throw new Error("Actress profile not found on JAVDB");
          const detailData = await detailRes.json();
          
          if (detailData.source === "fallback") {
             setToast({ message: "Hồ Sơ Cơ Bản", submessage: "Đang đồng bộ thêm dữ liệu từ các nguồn khác.", type: "info" });
             setTimeout(() => setToast(null), 3000);
          } else {
             setToast(null);
          }
          
          return detailData as JAVDBActress;
        } catch (err) {
          console.error("JAVDB Fetch Error:", err);
          return null;
        }
      }
      return getTMDBActorDetails(actor.id as number);
    },
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const getActorStats = () => {
    if (!details) return [];
    if (isTopXX) {
      const d = details as JAVDBActress;
      return [
        { label: "Nghệ danh", value: d.stageName, icon: User },
        { label: "Tên thật", value: d.realName, icon: Smile },
        { label: "Ngày sinh", value: d.birthDate, icon: Calendar },
        { label: "Số đo 3 vòng", value: d.measurements, icon: Ruler },
        { label: "Chiều cao", value: d.height, icon: Ruler },
        { label: "Quê quán", value: d.birthPlace || "N/A", icon: MapPin },
        { label: "Studio", value: d.studio || "Official", icon: Tv },
        { label: "Năm Debut", value: d.debutYear || "N/A", icon: Play },
        { label: "Trạng thái", value: d.status || "Active", icon: TrendingUp }
      ];
    }
    const d = details as any;
    return [
      { label: "Tên", value: d.name, icon: User },
      { label: "Ngày sinh", value: d.birthday || "N/A", icon: Calendar },
      { label: "Nơi sinh", value: d.place_of_birth || "N/A", icon: MapPin },
      { label: "Nghề nghiệp", value: d.known_for_department, icon: Tv },
      { label: "Độ nổi tiếng", value: Math.round(d.popularity), icon: TrendingUp }
    ];
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 md:p-8">
            <Transition.Child as={Fragment} enter="ease-out duration-700" enterFrom="opacity-0 translate-y-12 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-400" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-12 scale-95">
              <Dialog.Panel className="relative w-full max-w-7xl h-full md:h-auto min-h-screen md:min-h-[85vh] bg-[#0a0a0b] text-white overflow-hidden shadow-cinematic-3xl md:rounded-[64px] border border-white/5 flex flex-col">
                
                {/* Fixed Header with Visual Flourish */}
                <div className="sticky top-0 z-50 flex items-center justify-between px-8 md:px-16 py-8 md:py-10 bg-gradient-to-b from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent">
                  <div className="flex flex-col gap-1">
                    <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] font-black text-primary uppercase italic tracking-[0.4em]">Actress Intelligence Profile</motion.span>
                    <Dialog.Title className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">{actor?.name}</Dialog.Title>
                  </div>
                  <button onClick={onClose} className="w-14 h-14 md:w-16 md:h-16 rounded-[24px] bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 border border-white/10 group">
                    <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 md:px-16 pb-20">
                  <Tab.Group>
                    <Tab.List className="flex items-center gap-10 md:gap-14 border-b border-white/5 mb-14 overflow-x-auto pb-4 custom-scrollbar scrollbar-hide">
                      {['Thông tin cá nhân', 'Bộ sưu tập (Gallery)', 'Phim tiêu biểu'].map((tn) => (
                        <Tab key={tn} className={({ selected }) => `text-sm font-black uppercase italic tracking-[0.2em] transition-all outline-none pb-4 relative whitespace-nowrap ${selected ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}>
                          {({ selected }) => (
                            <>
                              {tn}
                              {selected && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_20px_var(--primary)]" />}
                            </>
                          )}
                        </Tab>
                      ))}
                    </Tab.List>

                    <Tab.Panels className="focus:outline-none">
                      {/* Tab 1: Info */}
                      <Tab.Panel className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-20 focus:outline-none">
                        <div className="space-y-16">
                           <div className="space-y-8">
                              <div className="flex items-center gap-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                                <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic">Biographical Data</span>
                                <div className="h-1.5 w-24 bg-primary/40 rounded-full" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                                {getActorStats().map((stat, i) => (
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
                              <div className="flex items-center gap-6">
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                                <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic">Verification Profile</span>
                                <div className="h-1.5 w-24 bg-primary/40 rounded-full" />
                              </div>
                              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="p-10 rounded-[48px] glass-pro border border-white/10 bg-white/[0.02] flex flex-col md:flex-row items-center gap-10">
                                 <div className="w-32 h-32 rounded-[32px] overflow-hidden border-2 border-primary/20 p-2 shadow-2xl">
                                    <img src={(isTopXX ? (details as JAVDBActress)?.profileImage : getTMDBImageUrl(profilePath)) || ""} className="w-full h-full object-cover rounded-[24px]" />
                                 </div>
                                 <div className="flex-1 space-y-4 text-center md:text-left">
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">PROFILE SYNCED WITH JAVDB</h4>
                                    <p className="text-sm font-medium text-white/40 leading-relaxed uppercase tracking-wider italic">Giao thức tìm kiếm tự động đã được kích hoạt. Thông tin diễn viên được lấy trực tiếp từ JAVDB với độ chính xác cao nhất.</p>
                                 </div>
                                 <div className="h-20 w-px bg-white/5 hidden md:block" />
                                 <Sparkles className="w-12 h-12 text-primary/20 animate-pulse" />
                              </motion.div>
                           </div>
                        </div>

                        <div className="space-y-10">
                           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group aspect-[3/4] rounded-[64px] overflow-hidden border border-white/5 shadow-cinematic-2xl self-start bg-black/40">
                              <img src={(isTopXX ? (details as JAVDBActress)?.profileImage : getTMDBImageUrl(profilePath, 'original')) || ""} className="w-full h-full object-cover transition-all duration-3000 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                              <div className="absolute inset-0 flex items-end p-12 translate-y-6 group-hover:translate-y-0 transition-all duration-700">
                                 <div className="glass-pro p-8 rounded-[36px] border border-white/10 w-full flex items-center justify-between shadow-2xl">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-black text-white/30 uppercase italic tracking-widest">Protocol Verified</span>
                                      <span className="text-xl font-black text-white italic uppercase tracking-tighter">OFFICIAL ID: JAV-SYNC</span>
                                    </div>
                                    <Heart className="w-8 h-8 text-primary/40 hover:text-red-500 transition-colors pointer-events-auto cursor-pointer" />
                                 </div>
                              </div>
                           </motion.div>
                        </div>
                      </Tab.Panel>

                      {/* Tab 2: Gallery */}
                      <Tab.Panel className="focus:outline-none">
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {isTopXX ? (
                              ((details as JAVDBActress)?.gallery?.length || 0) > 0 ? (
                                (details as JAVDBActress).gallery.map((img, i) => (
                                  <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} onClick={() => setLightboxImage(img)} className="group relative aspect-square rounded-[40px] overflow-hidden border border-white/5 active-depth bg-white/[0.02]">
                                     <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 group-hover:brightness-50" />
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon className="w-10 h-10 text-white" />
                                     </div>
                                  </motion.button>
                                ))
                              ) : (
                                 <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-8">
                                    <ImageIcon className="w-24 h-24 text-primary/20" />
                                    <p className="text-2xl tracking-[0.2em]">Gallery Data Unavailable</p>
                                 </div>
                              )
                            ) : (
                              <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-6">
                                 <ImageIcon className="w-20 h-20" />
                                 <p className="text-xl">Gallery limited to TopXX.</p>
                              </div>
                            )}
                         </div>
                      </Tab.Panel>

                      {/* Tab 3: Filmography */}
                      <Tab.Panel className="focus:outline-none pb-24">
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-10">
                            {isTopXX ? (
                              (details as JAVDBActress)?.filmography?.map((m, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group flex flex-col gap-5">
                                   <div className="relative aspect-[2/3] rounded-[42px] overflow-hidden bg-black border border-white/5 shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                                      <img src={m.poster} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 group-hover:brightness-50 transition-all duration-1000" />
                                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                                         <div className="px-3 py-1.5 glass-pro rounded-xl text-[10px] font-black text-white uppercase italic tracking-widest border border-white/10">
                                            {m.code}
                                         </div>
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-12 group-hover:translate-y-0">
                                         <a href={`/search?q=${encodeURIComponent(m.code)}`} className="px-8 py-4 bg-primary text-black text-[12px] font-black uppercase italic rounded-2xl shadow-cinematic-lg hover:scale-110 active:scale-95 transition-all">
                                            XEM NGAY
                                         </a>
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-1.5 px-4">
                                      <span className="text-[10px] font-black text-primary uppercase italic tracking-widest">{m.year} • RATING {m.rating}</span>
                                      <h5 className="font-black text-lg text-white/90 line-clamp-2 uppercase italic tracking-tight leading-tight group-hover:text-primary transition-colors">{m.title}</h5>
                                   </div>
                                </motion.div>
                              ))
                            ) : (
                               <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-30 italic font-black uppercase text-center gap-6">
                                  <Tv className="w-20 h-20" />
                                  <p className="text-xl">Movies fetched via TMDB standard.</p>
                               </div>
                            )}
                         </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>

                {/* Intelligent Dynamic Toast */}
                <AnimatePresence>
                  {toast && (
                    <motion.div initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.9 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[2000] min-w-[340px]">
                       <div className={`p-8 rounded-[40px] border shadow-cinematic-3xl backdrop-blur-3xl flex items-center gap-8 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'}`}>
                          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                             {toast.type === 'error' ? <Info className="w-8 h-8" /> : <Sparkles className="w-8 h-8 animate-pulse" />}
                          </div>
                          <div className="flex flex-col gap-1">
                             <h4 className={`text-xl font-black italic uppercase tracking-tighter ${toast.type === 'error' ? 'text-red-500' : 'text-primary'}`}>{toast.message}</h4>
                             <p className="text-[12px] font-black italic uppercase tracking-widest text-white/40">{toast.submessage}</p>
                          </div>
                          {toast.type === 'info' && (
                             <div className="ml-4">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full shadow-[0_0_10px_var(--primary)]" />
                             </div>
                          )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Improved Lightbox */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-20 bg-black/98" onClick={() => setLightboxImage(null)}>
               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative max-w-full max-h-full rounded-[48px] overflow-hidden shadow-cinematic-3xl border border-white/10" onClick={e => e.stopPropagation()}>
                  <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain" />
                  <button onClick={() => setLightboxImage(null)} className="absolute top-10 right-10 w-16 h-16 rounded-[24px] bg-black/60 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 hover:bg-primary hover:text-black transition-all">
                     <X className="w-8 h-8" />
                  </button>
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">
                     <button className="h-14 px-8 glass-pro rounded-2xl text-[11px] font-black uppercase italic tracking-widest text-white border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all">
                        <Share2 className="w-4 h-4" /> Share
                     </button>
                     <button className="h-14 px-8 bg-primary text-black rounded-2xl text-[11px] font-black uppercase italic tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                        <Star className="w-4 h-4" /> Best Quality
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </Transition.Root>
  );
}
