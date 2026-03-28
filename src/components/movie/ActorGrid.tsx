"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Search, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ActorModal = dynamic(() => import("./ActorModal").then(mod => mod.ActorModal), {
  ssr: false
});

interface ActorGridProps {
  isXX?: boolean;
  title?: string;
  actors?: any[]; // for passing manual list
}

export function ActorGrid({ isXX = false, title, actors: propActors }: ActorGridProps) {
  const [selectedActor, setSelectedActor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [isXX ? "trending-actresses" : "trending-actors"],
    queryFn: async () => {
      if (isXX) {
        const res = await fetch("/api/javdb/actresses/trending");
        return res.json();
      }
      // Fallback or TMDB trending actors if needed
      return { items: [] };
    },
    enabled: !propActors && isXX,
    staleTime: 1000 * 60 * 60,
  });

  const handleActorClick = (actor: any) => {
    if (isXX) {
      setSelectedActor({
        id: actor.id,
        name: actor.name,
        profile_path: null,
        profilePath: actor.profilePic
      });
    } else {
      setSelectedActor(actor);
    }
    setIsModalOpen(true);
  };

  const displayTitle = title || (isXX ? "JAVDB ELITES" : "DIỄN VIÊN NỔI BẬT");
  const displayActors = propActors || data?.items || [];

  if (isLoading && !propActors) {
    return (
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-4 px-4 overflow-hidden">
           <div className={cn("w-1.5 h-6 rounded-full", isXX ? "bg-yellow-500" : "bg-primary")} />
           <div className="w-48 h-6 bg-white/5 animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 px-4">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="aspect-[3/4] rounded-[40px] bg-white/5 animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  if (displayActors.length === 0) return null;

  return (
    <section className="space-y-12 py-10 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4 group">
          <div className={cn(
            "w-2 h-8 rounded-full shadow-lg", 
            isXX ? "bg-yellow-500 shadow-yellow-500/40" : "bg-primary shadow-primary/40"
          )} />
          <div className="space-y-0.5">
            <h3 className={cn(
              "font-black text-foreground uppercase italic tracking-tighter font-headline flex items-center gap-3",
              isXX ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
            )}>
              {displayTitle}
              <Sparkles className={cn("w-6 h-6 animate-pulse", isXX ? "text-yellow-500" : "text-primary")} />
            </h3>
            <p className="text-[10px] text-foreground-secondary font-black uppercase tracking-[0.4em] italic pl-1">
              {isXX ? "Syncing with direct archive protocol" : "Trending personalities worldwide"}
            </p>
          </div>
        </div>
        
        <button className={cn(
          "group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] italic transition-all",
          isXX ? "text-foreground-secondary hover:text-yellow-500" : "text-foreground-secondary hover:text-primary"
        )}>
           <span>{isXX ? "SHOW ALL RANKINGS" : "VIEW ALL"}</span>
           <div className={cn(
             "p-2 rounded-xl bg-white/5 group-hover:text-black transition-colors",
             isXX ? "group-hover:bg-yellow-500" : "group-hover:bg-primary"
           )}>
              <ChevronRight className="w-4 h-4" />
           </div>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10 px-4 sm:px-8">
        {displayActors.slice(0, 12).map((actor: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.05 }}
            onClick={() => handleActorClick(actor)}
            className="group relative flex flex-col gap-5 cursor-pointer select-none"
          >
             <div className={cn(
               "relative aspect-[3/4] rounded-[48px] overflow-hidden border border-white/5 shadow-2xl bg-surface transition-all duration-700",
               isXX ? "group-hover:shadow-yellow-500/10" : "group-hover:shadow-primary/10"
             )}>
                <img 
                  src={isXX ? actor.profilePic : (actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : "https://via.placeholder.com/300x400/0f1115/ffffff?text=No+Actor")} 
                  alt={actor.name} 
                  className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-115 group-hover:rotate-2 group-hover:brightness-[0.4]"
                />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0 backdrop-blur-[2px]">
                   <div className={cn(
                     "w-full py-4 text-[10px] font-black text-black uppercase italic rounded-2xl flex items-center justify-center gap-3 group-active:scale-90 transition-transform",
                     isXX ? "bg-yellow-500 shadow-[0_10px_30px_rgba(234,179,8,0.3)]" : "bg-primary shadow-primary/30"
                   )}>
                      <Search className="w-4 h-4" /> PROFILE DATA
                   </div>
                </div>

                <div className="absolute top-5 left-5 glass-pro px-4 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10">
                   <Star className={cn("w-3.5 h-3.5 fill-current", isXX ? "text-yellow-500" : "text-primary")} />
                   <span className="text-[10px] font-black text-white italic">
                     {isXX ? `Rank #${idx + 1}` : (actor.popularity ? Math.round(actor.popularity) : "Famous")}
                   </span>
                </div>
             </div>

             <div className="px-3 space-y-1.5 text-center">
                <h4 className={cn(
                  "text-[15px] font-black text-foreground transition-colors uppercase italic font-headline truncate leading-tight",
                  isXX ? "group-hover:text-yellow-500" : "group-hover:text-primary"
                )}>
                  {actor.name}
                </h4>
                {isXX && (
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/5 group-hover:bg-yellow-500/10 group-hover:border-yellow-500/20 transition-all">
                     <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                     <span className="text-[9px] font-black text-foreground-secondary uppercase italic tracking-widest group-hover:text-yellow-500 transition-colors">
                       CODE: {actor.featuredCode || "JAV"}
                     </span>
                  </div>
                )}
             </div>
          </motion.div>
        ))}
      </div>

      <ActorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actor={selectedActor}
        isXX={isXX}
      />
    </section>
  );
}
