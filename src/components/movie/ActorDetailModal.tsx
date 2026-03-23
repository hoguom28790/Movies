"use client";

import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, Film, Tv, Info, Search, ChevronRight, Heart, Sparkles, TrendingUp, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { searchMovies } from "@/services/api";
import { Movie } from "@/types/movie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ActorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number;
    name: string;
    profilePath: string | null;
  } | null;
}

interface TMDBCreditItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  character?: string;
  job?: string;
  popularity: number;
  original_title?: string;
  original_name?: string;
}

interface TMDBActorDetails {
  movie_credits?: {
    cast: TMDBCreditItem[];
  };
  tv_credits?: {
    cast: TMDBCreditItem[];
  };
}

export function ActorDetailModal({ isOpen, onClose, actor }: ActorDetailModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState<string | null>(null);

  // Added actor detail modal from TMDB credits -> search slug to /xem/[slug]
  const { data: details, isLoading } = useQuery<TMDBActorDetails | null>({
    queryKey: ["actor-credits", actor?.id],
    queryFn: () => actor ? getTMDBActorDetails(actor.id) : null,
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (cache 1 ngày)
  });

  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error"; link?: string } | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Check favorite status
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
      .trim();
  };

  const handleMovieClick = async (title: string, year: string | undefined, tmdbId: number, isTv: boolean) => {
    try {
      setIsSearching(title);
      setToast({ message: `Đang kết nối: ${title} ${year ? `(${year})` : ""}...`, type: "info" });
      
      const cleanTitle = title.replace(/\(Part\s+\d+\)/gi, "").replace(/\(Phần\s+\d+\)/gi, "").replace(/Season\s+\d+/gi, "").trim();
      const normalizedTitle = normalize(cleanTitle);
      
      // Normalize title + fallback search (year ±1, chỉ title) để tránh 404
      const searchResult = await searchMovies(cleanTitle);

      const findMatch = (items: Movie[]) => {
        return items.find((item) => {
          const itemTitle = normalize(item.title);
          const itemOrigin = normalize(item.originalTitle || "");
          const itemYear = parseInt(item.year || "0");
          const targetYear = parseInt(year || "0");
          const yearDiff = Math.abs(itemYear - targetYear);
          
          return (
            (itemTitle === normalizedTitle || itemOrigin === normalizedTitle) && 
            (year ? yearDiff <= 1 : true)
          );
        }) || items.find((item) => {
           const itemTitle = normalize(item.title);
           const itemOrigin = normalize(item.originalTitle || "");
           return itemTitle.includes(normalizedTitle) || itemOrigin.includes(normalizedTitle);
        }) || items[0];
      };

      const match = searchResult.items.length > 0 ? findMatch(searchResult.items) : null;

      if (match) {
        setToast(null);
        onClose();
        // Router.push(`/phim/${slug}`) to detail page (avoids 404 from /xem/[slug])
        router.push(`/phim/${match.slug}`);
        return;
      }

      setToast({ 
        message: "Phim chưa có trên site", 
        submessage: "Chúng tôi sẽ cập nhật sớm nhất có thể.",
        type: "error",
        link: `https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${tmdbId}`
      });
    } catch (error) {
       setToast({ message: "Lỗi hệ thống tìm kiếm. Thử lại sau.", type: "error" });
    } finally {
      setIsSearching(null);
    }
  };

  const MovieCard = ({ item, isTv, index }: { item: TMDBCreditItem; isTv: boolean; index: number }) => (
    <motion.button
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      onClick={() => handleMovieClick((item.title || item.name || "N/A") as string, (item.release_date || item.first_air_date)?.split("-")[0] as string | undefined, item.id, isTv)}
      className="group relative flex flex-col gap-4 text-left outline-none focus:ring-4 focus:ring-primary/20 rounded-[32px] overflow-hidden select-none active-depth"
    >
      <div className="relative aspect-[2/3] rounded-[28px] overflow-hidden bg-[#141416] shadow-cinematic-xl border border-white/5">
        <img
          src={getTMDBImageUrl(item.poster_path, 'w500') || "/placeholder-poster.png"}
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-50 group-hover:rotate-[-1deg]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-cinematic-lg group-hover:scale-110 transition-transform duration-500">
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
             </div>
             <div className="space-y-0.5">
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic drop-shadow-md">Watch Now</span>
                <span className="block text-[12px] font-black uppercase tracking-[0.1em] text-white italic drop-shadow-md">XEM NGAY</span>
             </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 px-3 py-1.5 glass-pro rounded-xl flex items-center gap-1.5 shadow-2xl border border-white/10">
          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
          <span className="text-[12px] font-black text-white">{item.vote_average ? item.vote_average.toFixed(1) : "N/A"}</span>
        </div>
      </div>
      
      <div className="space-y-1 px-2 transition-transform duration-500 group-hover:translate-x-1">
        <h5 className="text-[15px] font-black text-white group-hover:text-primary transition-colors line-clamp-1 italic uppercase tracking-tight font-headline">
          {item.title || item.name}
        </h5>
        <div className="flex items-center justify-between text-[11px] text-white/30 font-black uppercase tracking-widest italic overflow-hidden">
          <span className="line-clamp-1">{item.character || item.job || "Vai diễn"}</span>
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
             <span className="text-[10px] font-bold text-white uppercase tracking-[0.4em] italic animate-pulse">Searching...</span>
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto no-scrollbar">
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:p-4 md:p-8 lg:p-12">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-800 spring-3"
              enterFrom="opacity-0 translate-y-64 scale-90 blur-xl"
              enterTo="opacity-100 translate-y-0 scale-100 blur-0"
              leave="ease-in duration-500"
              leaveFrom="opacity-100 translate-y-0 scale-100 blur-0"
              leaveTo="opacity-0 translate-y-64 scale-90 blur-xl"
            >
              <Dialog.Panel className="relative w-full max-w-7xl transform overflow-hidden bg-[#0a0a0b] text-left transition-all sm:rounded-[64px] border border-white/5 shadow-cinematic-2xl flex flex-col h-[100vh] sm:h-[90vh]">
                
                {/* Header Section */}
                <div className="relative h-[250px] sm:h-[350px] md:h-[450px] flex-shrink-0 bg-cover bg-center overflow-hidden" 
                     style={{ backgroundImage: details?.movie_credits?.cast[0]?.backdrop_path ? `url(${getTMDBImageUrl(details.movie_credits.cast[0].backdrop_path, 'original')})` : 'none' }}>
                  
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
                  
                  <button onClick={onClose} className="absolute top-8 right-8 p-4 rounded-2xl glass-pro text-white hover:bg-primary transition-all z-30 border border-white/10 group">
                    <X className="w-7 h-7 stroke-[3px] group-hover:rotate-90 transition-transform duration-500" />
                  </button>

                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col md:flex-row items-end gap-8">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 15, delay: 0.2 }}
                      className="w-32 h-32 md:w-48 md:h-48 rounded-[48px] overflow-hidden border-[8px] border-[#0a0a0b] shadow-2xl relative flex-shrink-0"
                    >
                       <img 
                         src={getTMDBImageUrl(actor?.profilePath || null, 'w500') || ""} 
                         alt={actor?.name}
                         className="w-full h-full object-cover"
                       />
                    </motion.div>
                    
                    <div className="flex-grow space-y-4">
                       <div className="flex flex-col">
                          <motion.h3 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none"
                          >
                             {actor?.name} - Phim đã tham gia
                          </motion.h3>
                       </div>
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-4">
                          <span className="px-5 py-2 rounded-xl bg-primary text-white text-[10px] font-black tracking-widest uppercase italic">PROFILE ACTIVE</span>
                          <span className="px-5 py-2 rounded-xl glass-pro text-white/40 text-[10px] font-black tracking-widest uppercase italic border border-white/10">
                            {details ? `${(details.movie_credits?.cast?.length || 0) + (details.tv_credits?.cast?.length || 0)} TÁC PHẨM` : "ĐANG TẢI..."}
                          </span>
                       </motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto px-8 md:px-16 py-8 no-scrollbar">
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                       {[...Array(12)].map((_, i) => (
                         <div key={i} className="space-y-4 animate-pulse">
                            <div className="aspect-[2/3] bg-white/5 rounded-[32px]" />
                            <div className="h-5 bg-white/5 rounded-lg w-4/5" />
                         </div>
                       ))}
                    </div>
                  ) : (
                    <Tab.Group>
                       <Tab.List className="flex gap-8 border-b border-white/5 mb-8 sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-3xl z-40 py-4">
                          <Tab className={({ selected }) => `pb-4 text-[12px] font-black tracking-widest outline-none transition-all uppercase italic flex items-center gap-3 ${selected ? "text-primary border-b-4 border-primary" : "text-white/20 hover:text-white/40" }`}>
                             <Film className="w-5 h-5" /> Phim Điện Ảnh
                          </Tab>
                          <Tab className={({ selected }) => `pb-4 text-[12px] font-black tracking-widest outline-none transition-all uppercase italic flex items-center gap-3 ${selected ? "text-primary border-b-4 border-primary" : "text-white/20 hover:text-white/40" }`}>
                             <Tv className="w-5 h-5" /> Series TV
                          </Tab>
                       </Tab.List>
                       <Tab.Panels>
                          <Tab.Panel>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 pb-12">
                                {details?.movie_credits?.cast?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).map((m, idx) => (
                                  <MovieCard key={`${m.id}-${idx}`} item={m} isTv={false} index={idx} />
                                ))}
                             </div>
                          </Tab.Panel>
                          <Tab.Panel>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 pb-12">
                                {details?.tv_credits?.cast?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).map((m, idx) => (
                                  <MovieCard key={`${m.id}-${idx}`} item={m} isTv={true} index={idx} />
                                ))}
                             </div>
                          </Tab.Panel>
                       </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>

                <div className="glass-pro border-t border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-50">
                   <div className="flex items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-widest italic leading-none">
                      <Info className="w-5 h-5 text-primary" />
                      <span>Bấm vào card để tìm kiếm và xem phim trực tiếp trên site</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] text-white/10 font-black uppercase tracking-widest italic">Data by TMDB • Internal Search v1.0</span>
                   </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      {/* Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed bottom-8 right-8 z-[3000] p-6 rounded-[32px] glass-pro shadow-2xl border border-white/10 flex flex-col gap-4 max-w-sm`}
          >
             <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                  {toast.type === 'error' ? <X className="w-6 h-6" /> : <Search className="w-6 h-6 animate-pulse" />}
                </div>
                <div>
                  <p className="text-[15px] font-black text-white italic uppercase tracking-tight">{toast.message}</p>
                  {toast.submessage && <p className="text-[11px] text-white/40 font-black uppercase tracking-widest italic mt-1">{toast.submessage}</p>}
                </div>
             </div>
             
             {toast.link && (
                <a 
                  href={toast.link} 
                  target="_blank" 
                  className="py-3 px-6 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 italic border border-white/5"
                >
                   Mở TMDB Profile <ExternalLink className="w-3.5 h-3.5" />
                </a>
             )}
             
             <button onClick={() => setToast(null)} className="absolute top-4 right-4 p-1 text-white/20 hover:text-white">
                <X className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Transition.Root>
  );
}
