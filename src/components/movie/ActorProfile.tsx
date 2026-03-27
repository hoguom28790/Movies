"use client";

import React, { useState, useEffect } from "react";
import { Star, Heart, Check, Play, User, Search, Twitter, Instagram, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { toggleFavoriteActor, isFavoriteActor } from "@/services/db";
import { cn } from "@/lib/utils";

interface ActorProfileProps {
  actorName: string;
  slug: string;
  isXX?: boolean;
}

export function ActorProfile({ actorName, slug, isXX = false }: ActorProfileProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  
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
    
    // For TopXX, we don't always have full actor data here yet
    // but the db service handles simple object
    const success = await toggleFavoriteActor(user.uid, {
      id: slug,
      name: actorName,
      profilePath: "", // Placeholder
      type: isXX ? 'topxx' : 'movie'
    });
    
    if (success !== undefined) setIsFav(success);
  };

  return (
    <div className="relative mb-20">
      <div className={cn(
        "relative rounded-[48px] overflow-hidden bg-surface-tonal border border-white/5 shadow-cinematic-2xl",
        isXX ? "bg-gradient-to-br from-yellow-500/10 via-background to-background" : "bg-gradient-to-br from-primary/10 via-background to-background"
      )}>
        <div className="p-10 md:p-20 flex flex-col md:flex-row items-center gap-12">
           {/* Avatar Placeholder */}
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={cn(
               "w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center border-4 shadow-2xl relative group",
               isXX ? "bg-yellow-500/5 border-yellow-500/20" : "bg-primary/5 border-primary/20"
             )}
           >
              <User className={cn("w-24 h-24", isXX ? "text-yellow-500/20" : "text-primary/20")} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
           </motion.div>

           <div className="flex-1 text-center md:text-left space-y-8">
              <div className="space-y-4">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
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
                 
                 <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none select-none drop-shadow-2xl">
                    {actorName}
                 </h1>
                 
                 <p className="text-foreground/40 font-bold uppercase tracking-[0.3em] text-[11px] italic">
                    {isXX ? "ICONS OF THE ADULT ENTERTAINMENT" : "GƯƠNG MẶT ĐIỆN ẢNH TIÊU BIỂU"}
                 </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                 <Button 
                   onClick={handleToggleFav}
                   className={cn(
                     "rounded-[32px] px-10 h-16 text-sm font-black uppercase tracking-widest shadow-2xl transition-all active-depth",
                     isFav 
                       ? "bg-foreground text-background" 
                       : (isXX ? "bg-yellow-500 text-black shadow-yellow-500/30" : "bg-primary text-white shadow-primary/30")
                   )}
                 >
                    {isFav ? <Check className="w-5 h-5 mr-3" /> : <Heart className="w-5 h-5 mr-3" />}
                    {isFav ? "Đã Yêu Thích" : "Yêu Thích Diễn Viên"}
                 </Button>
                 
                 <div className="flex items-center gap-2">
                    {[Twitter, Instagram, Globe].map((Icon, i) => (
                      <button key={i} className="w-16 h-16 rounded-full glass-pro border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all active-depth">
                        <Icon className="w-6 h-6" />
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
