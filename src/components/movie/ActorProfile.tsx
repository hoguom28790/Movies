"use client";

import React, { useState, useEffect } from "react";
import { Star, Heart, Check, Play, User, Calendar, Smile, Ruler, MapPin, Tv, TrendingUp, Zap, Image as ImageIcon, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavoriteActor, isFavoriteActor } from "@/services/db";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ActorProfileProps {
  actorName: string;
  slug: string;
  isXX?: boolean;
}

export function ActorProfile({ actorName, slug, isXX = false }: ActorProfileProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const { data: details, isLoading } = useQuery({
    queryKey: [isXX ? "actor-javlib-profile" : "actor-details-profile", isXX ? actorName.toLowerCase() : slug],
    queryFn: async () => {
      if (!isXX) return null; // Standard actors use different logic if needed, but here we focus on TopXX
      try {
        const detailRes = await fetch(`/api/javlibrary/actress/${encodeURIComponent(actorName)}`);
        if (!detailRes.ok) throw new Error("Metadata unreachable");
        return await detailRes.json();
      } catch (err) {
        return {
          stageName: actorName,
          realName: "N/A",
          birthDate: "Đang cập nhật",
          measurements: "N/A",
          height: "N/A",
          profileImage: "",
          gallery: [],
          studio: "Elite Art"
        };
      }
    },
    enabled: isXX,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (user) {
      isFavoriteActor(user.uid, slug, isXX ? 'topxx' : 'movie').then(setIsFav);
    }
  }, [user, slug, isXX]);

  const handleToggleFav = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu diễn viên yêu thích!");
      return;
    }
    
    const success = await toggleFavoriteActor(user.uid, {
      id: slug,
      name: actorName,
      profilePath: details?.profileImage || "",
      type: isXX ? 'topxx' : 'movie'
    });
    
    if (success !== undefined) setIsFav(success);
  };

  if (isLoading && isXX) {
     return (
       <div className="w-full h-96 flex items-center justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
       </div>
     );
  }

  const profileImageUrl = details?.profileImage || "";

  return (
    <div className="relative mb-20 space-y-12">
      <div className={cn(
        "relative rounded-[48px] overflow-hidden border border-white/5 shadow-cinematic-2xl transition-all duration-1000",
        isXX ? "bg-gradient-to-br from-yellow-500/10 via-background to-background" : "bg-gradient-to-br from-primary/10 via-background to-background"
      )}>
        <div className="p-8 md:p-16 flex flex-col lg:flex-row items-center lg:items-end gap-10 md:gap-16">
           {/* Avatar */}
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={cn(
               "w-48 h-48 md:w-64 md:h-64 rounded-[56px] overflow-hidden border-4 shadow-2xl relative group flex-shrink-0",
               isXX ? "bg-yellow-500/5 border-yellow-500/20" : "bg-primary/5 border-primary/20"
             )}
           >
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
                  alt={actorName}
                />
              ) : (
                <User className={cn("w-24 h-24 m-auto mt-10 md:mt-20", isXX ? "text-yellow-500/20" : "text-primary/20")} />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
           </motion.div>

           <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="space-y-4">
                 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <span className={cn(
                      "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-xl",
                      isXX ? "bg-yellow-500 text-black border-yellow-500 shadow-yellow-500/20" : "bg-primary text-white border-primary shadow-primary/20"
                    )}>
                       PREMIUM ARTIST
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500">
                       {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                 </div>
                 
                 <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-foreground uppercase italic tracking-tighter leading-none select-none drop-shadow-2xl">
                    {actorName}
                 </h1>
                 
                 <p className="text-foreground/40 font-bold uppercase tracking-[0.3em] text-[10px] md:text-[11px] italic">
                    {isXX ? (details?.studio ? `${details.studio} ICONS` : "ICONS OF THE ADULT ENTERTAINMENT") : "GƯƠNG MẶT ĐIỆN ẢNH TIÊU BIỂU"}
                 </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                 <Button 
                   onClick={handleToggleFav}
                   className={cn(
                     "rounded-[32px] px-8 md:px-10 h-14 md:h-16 text-[10px] md:text-sm font-black uppercase tracking-widest shadow-2xl transition-all active-depth",
                     isFav 
                       ? "bg-foreground text-background" 
                       : (isXX ? "bg-yellow-500 text-black shadow-yellow-500/30" : "bg-primary text-white shadow-primary/30")
                   )}
                 >
                    {isFav ? <Check className="w-4 h-4 md:w-5 md:h-5 mr-3" /> : <Heart className="w-4 h-4 md:w-5 md:h-5 mr-3" />}
                    {isFav ? "Đã Yêu Thích" : "Yêu Thích Diễn Viên"}
                 </Button>
                 
                 <div className="flex items-center gap-4">
                    {details?.birthDate && details.birthDate !== "N/A" && (
                      <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10">
                        <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-widest">Born</span>
                        <span className="text-xs font-black text-foreground italic">{details.birthDate}</span>
                      </div>
                    )}
                    {details?.height && details.height !== "N/A" && (
                      <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10">
                        <span className="text-[8px] font-black uppercase text-foreground/20 italic tracking-widest">Height</span>
                        <span className="text-xs font-black text-foreground italic">{details.height}</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {isXX && details && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-bottom duration-1000">
           {/* Detailed Stats */}
           <div className="bg-surface rounded-[40px] p-8 md:p-12 border border-foreground/5 shadow-xl space-y-10">
              <div className="flex items-center gap-4 border-b border-foreground/5 pb-6">
                <Smile className="w-6 h-6 text-yellow-500" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Biographical Info</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                {[
                  { label: "Nghệ danh", value: details.stageName, icon: User },
                  { label: "Tên thật", value: details.realName, icon: Zap },
                  { label: "Ngày sinh", value: details.birthDate, icon: Calendar },
                  { label: "Số đo", value: details.measurements, icon: Ruler },
                  { label: "Chiều cao", value: details.height, icon: Ruler },
                  { label: "Quê quán", value: details.birthPlace, icon: MapPin },
                  { label: "Studio", value: details.studio, icon: Tv },
                  { label: "Debut", value: details.debutYear, icon: Play },
                ].map((stat, i) => (
                  <div key={i} className={cn("space-y-1", stat.value === "N/A" && "opacity-30")}>
                    <p className="text-[9px] font-black uppercase text-foreground/20 tracking-widest italic">{stat.label}</p>
                    <p className="text-lg md:text-xl font-black text-foreground/80 italic tracking-tight">{stat.value || "Protected"}</p>
                  </div>
                ))}
              </div>
           </div>

           {/* Gallery Preview */}
           <div className="bg-surface rounded-[40px] p-8 md:p-12 border border-foreground/5 shadow-xl space-y-10">
              <div className="flex items-center justify-between border-b border-foreground/5 pb-6">
                <div className="flex items-center gap-4">
                  <ImageIcon className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Gallery</h3>
                </div>
                {details.gallery?.length > 0 && <span className="text-[10px] font-black text-foreground/20">{details.gallery.length} PHOTOS</span>}
              </div>

              {details.gallery?.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {details.gallery.slice(0, 6).map((img: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setLightboxImage(img)}
                      className="relative aspect-square rounded-3xl overflow-hidden bg-foreground/5 border border-foreground/5 group"
                    >
                      <img src={img} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:brightness-50" alt={`gallery-${i}`} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <PlayCircle className="w-8 h-8 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-foreground/10 border-2 border-dashed border-foreground/5 rounded-3xl">
                   <ImageIcon className="w-12 h-12 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest italic">No gallery available</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-20"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-full max-h-full">
               <img src={lightboxImage} className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-4 border-white/5" />
               <button className="absolute -top-12 right-0 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">CLOSE <Check className="w-4 h-4" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
