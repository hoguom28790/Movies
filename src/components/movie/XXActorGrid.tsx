"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Play, Search, TrendingUp, Sparkles, User, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const ActorModal = dynamic(() => import("./ActorModal").then(mod => mod.ActorModal), {
  ssr: false
});

export function XXActorGrid() {
  const [selectedActor, setSelectedActor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trending-actresses"],
    queryFn: async () => {
      const res = await fetch("/api/javdb/actresses/trending");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleActorClick = (actor: any) => {
    setSelectedActor({
      id: actor.id,
      name: actor.name,
      profile_path: null,
      profilePath: actor.profilePic
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-4 px-4 overflow-hidden">
           <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
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

  const actresses = data?.items || [];
  if (actresses.length === 0) return null;

  return (
    <section className="space-y-12 py-10 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4 group">
          <div className="w-2 h-8 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)]" />
          <div className="space-y-0.5">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter font-headline flex items-center gap-3">
              JAVDB ELITES
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] italic pl-1">Syncing with direct archive protocol</p>
          </div>
        </div>
        
        <button className="group flex items-center gap-4 text-[11px] font-black text-white/30 hover:text-yellow-500 uppercase tracking-[0.2em] italic transition-all">
           <span>SHOW ALL RANKINGS</span>
           <div className="p-2 rounded-xl bg-white/5 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
              <ChevronRight className="w-4 h-4" />
           </div>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10 px-4 sm:px-8">
        {actresses.slice(0, 12).map((actor: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.05 }}
            onClick={() => handleActorClick(actor)}
            className="group relative flex flex-col gap-5 cursor-pointer select-none"
          >
             <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden border border-white/5 shadow-2xl bg-surface group-hover:shadow-yellow-500/10 transition-all duration-700">
                <img 
                  src={actor.profilePic} 
                  alt={actor.name} 
                  className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-115 group-hover:rotate-2 group-hover:brightness-[0.4]"
                />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0 backdrop-blur-[2px]">
                   <div className="w-full py-4 bg-yellow-500 text-[10px] font-black text-black uppercase italic rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(234,179,8,0.3)] group-active:scale-90 transition-transform">
                      <Search className="w-4 h-4 text-black" /> PROFILE DATA
                   </div>
                </div>

                <div className="absolute top-5 left-5 glass-pro px-4 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10">
                   <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                   <span className="text-[10px] font-black text-white italic">Rank #{idx + 1}</span>
                </div>
             </div>

             <div className="px-3 space-y-1.5 text-center">
                <h4 className="text-[15px] font-black text-white group-hover:text-yellow-500 transition-colors uppercase italic font-headline truncate leading-tight">
                  {actor.name}
                </h4>
                <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 group-hover:bg-yellow-500/10 group-hover:border-yellow-500/20 transition-all">
                   <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                   <span className="text-[9px] font-black text-white/20 uppercase italic tracking-widest group-hover:text-yellow-500 transition-colors">
                     CODE: {actor.featuredCode || "SSIS-XXX"}
                   </span>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <ActorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actor={selectedActor}
        isTopXX={true}
      />
    </section>
  );
}
