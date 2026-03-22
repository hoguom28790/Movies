"use client";

import React, { useState, Fragment } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { X, Play, Star, Calendar, User, Film, Tv, Info, Search, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { searchMovies } from "@/services/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: {
    id: number;
    name: string;
    profile_path: string | null;
  } | null;
}

export function ActorModal({ isOpen, onClose, actor }: ActorModalProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState<string | null>(null);

  const { data: details, isLoading } = useQuery({
    queryKey: ["actor", actor?.id],
    queryFn: () => actor ? getTMDBActorDetails(actor.id) : null,
    enabled: !!actor && isOpen,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const [toast, setToast] = useState<{ message: string; submessage?: string; type: "info" | "error"; link?: string } | null>(null);

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Clean double spaces
      .replace(/(phan|part|season|tap)\s*\d+/gi, "") // Remove part/season fragments
      .trim();
  };

  const handleMovieClick = async (title: string, year: string, tmdbId: number, isTv: boolean) => {
    try {
      setIsSearching(title);
      setToast({ message: `Đang tìm: ${title} (${year})...`, type: "info" });
      
      const cleanTitle = title.replace(/\(Part\s+\d+\)/gi, "").replace(/\(Phần\s+\d+\)/gi, "").trim();
      const normalizedTitle = normalize(cleanTitle);
      
      console.log(`[ActorModal] Searching for: "${title}" | Normalized: "${normalizedTitle}" | Year: ${year}`);

      // Strategy 1: Search with cleaned title
      let searchResult = await searchMovies(cleanTitle);
      console.log(`[ActorModal] Search API Response (Clean Title):`, searchResult.items.length, "results");

      // Strategy 2: If no results, search with normalized title
      if (searchResult.items.length === 0 && normalizedTitle !== cleanTitle.toLowerCase()) {
        searchResult = await searchMovies(normalizedTitle);
        console.log(`[ActorModal] Search API Response (Normalized):`, searchResult.items.length, "results");
      }

      // Finding strategy
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

      const match = searchResult.items.length > 0 ? findMatch(searchResult.items) : null;

      if (match) {
        console.log(`[ActorModal] Match found: ${match.title} (${match.year}) -> /xem/${match.slug}`);
        setToast(null);
        onClose();
        router.push(`/xem/${match.slug}`);
      } else {
        console.warn(`[ActorModal] No match found for: ${title}`);
        setToast({ 
          message: "Phim này hiện chưa có trên hệ thống.", 
          submessage: "Bạn có thể xem thông tin chi tiết trên TMDB.",
          type: "error",
          link: `https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${tmdbId}`
        });
      }
    } catch (error) {
       console.error("Search error:", error);
       setToast({ message: "Lỗi hệ thống khi tìm kiếm. Vui lòng thử lại sau.", type: "error" });
    } finally {
      setIsSearching(null);
    }
  };

  const MovieCard = ({ item, isTv }: { item: any; isTv: boolean }) => (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleMovieClick(item.title || item.name, (item.release_date || item.first_air_date)?.split("-")[0], item.id, isTv)}
      className="group relative flex flex-col gap-3 text-left outline-none focus:ring-2 focus:ring-primary rounded-xl overflow-hidden"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-foreground/5 shadow-2xl">
        <img
          src={getTMDBImageUrl(item.poster_path, 'w342') || "/placeholder-poster.png"}
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                <Play className="w-4 h-4 fill-current" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">Xem Ngay</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-[11px] font-black text-white">{item.vote_average?.toFixed(1) || "0.0"}</span>
        </div>
      </div>
      
      <div className="space-y-1 px-1">
        <h5 className="text-[13px] font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 italic">
          {item.title || item.name}
        </h5>
        <div className="flex items-center justify-between text-[10px] text-foreground/40 font-bold uppercase tracking-tight">
          <span className="line-clamp-1">{item.character || "N/A"}</span>
          <span>{(item.release_date || item.first_air_date)?.split("-")[0]}</span>
        </div>
      </div>

      {isSearching === (item.title || item.name) && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
           <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </motion.button>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background/90 backdrop-blur-2xl transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4 mt-safe">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 translate-y-24 sm:scale-95 sm:translate-y-0"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-24 sm:scale-95 sm:translate-y-0"
            >
              <Dialog.Panel className="relative w-full transform overflow-hidden bg-background text-left transition-all sm:my-8 sm:max-w-6xl sm:rounded-3xl border-t sm:border border-foreground/5 shadow-2xl flex flex-col h-screen sm:h-[85vh]">
                
                {/* Header Section */}
                <div className="relative h-[250px] sm:h-[300px] flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: details?.movie_credits?.cast[0]?.backdrop_path ? `url(${getTMDBImageUrl(details.movie_credits.cast[0].backdrop_path, 'original')})` : 'none' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20" />
                  
                  <button onClick={onClose} className="absolute top-4 right-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all z-20 backdrop-blur-md mt-safe">
                    <X className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 flex flex-col sm:flex-row items-end gap-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-background shadow-2xl flex-shrink-0 relative group">
                       <img 
                         src={getTMDBImageUrl(actor?.profile_path || null, 'w500') || ""} 
                         alt={actor?.name}
                         className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="flex-grow space-y-2">
                       <h3 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-foreground drop-shadow-lg">
                          {actor?.name}
                       </h3>
                       <div className="flex flex-wrap gap-3">
                          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black tracking-widest uppercase">DIỄN VIÊN</span>
                          <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground/50 text-[10px] font-black tracking-widest uppercase">
                            {details ? `${details.movie_credits?.cast?.length + (details.tv_credits?.cast?.length || 0)} TÁC PHẨM` : "PHIM CỦA DIỄN VIÊN"}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto px-6 sm:px-10 py-6 no-scrollbar">
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                       {[...Array(12)].map((_, i) => (
                         <div key={i} className="space-y-3 animate-pulse">
                            <div className="aspect-[2/3] bg-foreground/5 rounded-2xl" />
                            <div className="h-4 bg-foreground/5 rounded w-3/4" />
                            <div className="h-3 bg-foreground/10 rounded w-1/2" />
                         </div>
                       ))}
                    </div>
                  ) : (
                    <Tab.Group>
                       <Tab.List className="flex gap-8 border-b border-foreground/5 mb-8">
                          <Tab className={({ selected }) => `pb-4 text-[13px] font-black tracking-widest outline-none transition-all uppercase ${selected ? "text-primary border-b-2 border-primary" : "text-foreground/20 hover:text-foreground/50" }`}>
                            <div className="flex items-center gap-2"><Film className="w-4 h-4" /> PHIM ĐIỆN ẢNH</div>
                          </Tab>
                          <Tab className={({ selected }) => `pb-4 text-[13px] font-black tracking-widest outline-none transition-all uppercase ${selected ? "text-primary border-b-2 border-primary" : "text-foreground/20 hover:text-foreground/50" }`}>
                            <div className="flex items-center gap-2"><Tv className="w-4 h-4" /> SERIES TV</div>
                          </Tab>
                       </Tab.List>
                       <Tab.Panels>
                          <Tab.Panel className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
                                {details?.movie_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 30).map((m: any) => (
                                  <MovieCard key={m.id} item={m} isTv={false} />
                                ))}
                             </div>
                          </Tab.Panel>
                          <Tab.Panel className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
                                {details?.tv_credits?.cast?.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 30).map((m: any) => (
                                  <MovieCard key={m.id} item={m} isTv={true} />
                                ))}
                             </div>
                          </Tab.Panel>
                       </Tab.Panels>
                    </Tab.Group>
                  )}
                </div>

                <div className="bg-foreground/[0.02] border-t border-foreground/[0.06] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-2 text-[10px] text-foreground/30 font-black uppercase tracking-[0.2em]">
                      <Info className="w-4 h-4" /> Bấm vào phim để tìm và xem trực tiếp trên hệ thống
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] text-foreground/20 font-medium">Dữ liệu cung cấp bởi TMDB</span>
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
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed bottom-8 right-0 sm:right-8 z-[2100] p-6 rounded-t-3xl sm:rounded-3xl backdrop-blur-3xl shadow-2xl border flex flex-col gap-2 w-full sm:max-w-sm ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'}`}
          >
             <div className="flex items-center gap-3">
                {toast.type === 'error' ? <Info className="text-red-500 w-5 h-5" /> : <Search className="text-primary w-5 h-5 animate-pulse" />}
                <p className="text-[13px] font-black text-foreground">{toast.message}</p>
             </div>
             {toast.submessage && <p className="text-[11px] text-foreground/50 font-medium pl-8">{toast.submessage}</p>}
             {toast.link && (
                <a href={toast.link} target="_blank" className="ml-8 mt-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                   Xem trên TMDB <ChevronRight className="w-3 h-3" />
                </a>
             )}
             <button onClick={() => setToast(null)} className="absolute top-4 right-4 text-foreground/20 hover:text-foreground">
                <X className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Transition.Root>
  );
}
// Click actor image → TMDB movie_credits/tv_credits modal → search site's API by title+year → navigate to /xem/[slug]
