// ActorModal for Hồ Phim - RESTORED Simple 2-tab layout with Phim Lẻ and Phim Truyền Hình
"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Heart, Film, Tv, Calendar, Search } from "lucide-react";
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
  } | null;
}

export function ActorModal({ isOpen, onClose, actor }: ActorModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);
  const [isFav, setIsFav] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor-details", actor?.id],
    queryFn: () => actor ? getTMDBActorDetails(actor.id as number) : null,
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

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
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const normalize = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").replace(/(phan|part|season|tap)\s*\d+/gi, "").trim();
  };

  const handleMovieClick = async (title: string, year: string) => {
    try {
      setToast({ message: `Đang kết nối: ${title}...`, type: "info" });
      const normalizedTitle = normalize(title);
      const { searchMovies } = await import("@/services/api");
      const searchRes = await searchMovies(normalizedTitle);
      
      const match = searchRes.items.find((item: any) => {
        const itemTitle = normalize(item.title);
        const itemYear = parseInt(item.year);
        const targetYear = parseInt(year);
        return itemTitle === normalizedTitle && (year ? Math.abs(itemYear - targetYear) <= 1 : true);
      }) || searchRes.items[0];

      if (match) {
        onClose();
        router.push(`/phim/${match.slug}`); 
      } else {
        setToast({ message: "Sản phẩm chưa có mặt trên cửa hàng.", type: "error" });
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
      await toggleFavoriteActor(user.uid, {
        id: actor.id,
        name: actor.name,
        profilePath: (actor.profile_path || null) as (string | null),
        type: 'movie'
      });
      setIsFav(!isFav);
    } catch (err) {}
  };

  const credits = details?.combined_credits?.cast || [];
  const movieCredits = credits.filter((m: any) => m.media_type === 'movie').sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
  const tvCredits = credits.filter((m: any) => m.media_type === 'tv').sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-300" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/90 backdrop-blur-xl" /></Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto pt-safe">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-500" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-300" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-6xl transform bg-[#0a0a0b] text-left transition-all rounded-[32px] border border-white/5 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 text-white hover:text-primary z-[100] border border-white/10 active-depth transition-all"><X className="w-6 h-6" /></button>
                <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="p-8 sm:p-12 md:p-16 flex flex-col sm:flex-row gap-10 items-center sm:items-end bg-gradient-to-b from-primary/10 to-transparent">
                        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden border-8 border-[#0a0a0b] shadow-2xl flex-shrink-0">
                           <img src={getTMDBImageUrl(actor?.profile_path || null, 'w500') || "/placeholder-actor.png"} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4 text-center sm:text-left pb-4">
                           <h3 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none font-headline">{actor?.name}</h3>
                           <div className="flex gap-4 items-center justify-center sm:justify-start">
                              <span className="px-5 py-2 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest italic shadow-lg">DIỄN VIÊN</span>
                              <button onClick={handleToggleFav} className={`p-3 rounded-2xl border transition-all active-depth ${isFav ? 'bg-[#ef4444] border-[#ef4444] text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}><Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} /></button>
                           </div>
                        </div>
                    </div>
                    <div className="px-8 sm:px-12 md:px-16 py-8">
                       {isLoading ? (
                           <div className="flex gap-10 py-10 opacity-20"><div className="w-40 h-6 bg-white rounded-full animate-pulse" /><div className="w-40 h-6 bg-white rounded-full animate-pulse" /></div>
                       ) : (
                         <Tab.Group>
                           <Tab.List className="flex gap-10 border-b border-white/5 mb-10 overflow-x-auto no-scrollbar">
                             {["PHIM LẺ", "PHIM TRUYỀN HÌNH"].map((name) => (
                                <Tab key={name} className={({ selected }) => `pb-6 text-[14px] font-black tracking-widest outline-none uppercase italic transition-all relative ${selected ? "text-primary" : "text-white/20 hover:text-white"}`}>
                                  {({ selected }) => (<>{name}{selected && <motion.div layoutId="activeActorTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}</>)}
                                </Tab>
                             ))}
                           </Tab.List>
                           <Tab.Panels>
                              <Tab.Panel className="focus:outline-none">
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                    {movieCredits.slice(0, 50).map((m: any, idx: number) => (
                                       <motion.button key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleMovieClick(m.title, (m.release_date || "")?.split("-")[0])} className="group flex flex-col gap-4 text-left active-depth">
                                          <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-white/5 border border-white/5 shadow-xl transition-all group-hover:shadow-primary/10">
                                             <img src={getTMDBImageUrl(m.poster_path, 'w342') || "/placeholder-poster.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                                             <img src={getTMDBImageUrl(m.poster_path, 'w342') || "/placeholder-poster.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed bottom-10 right-10 z-[3000] p-6 rounded-2xl glass-pro shadow-2xl border border-white/10"><p className="text-sm font-black text-white uppercase italic">{toast.message}</p></motion.div>}</AnimatePresence>
    </Transition.Root>
  );
}
