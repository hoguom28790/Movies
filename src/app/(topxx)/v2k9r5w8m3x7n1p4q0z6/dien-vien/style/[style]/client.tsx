"use client";

import React, { useState, useEffect } from "react";
import { Loader2, User2, Search } from "lucide-react";
import { ActorModal } from "@/components/movie/ActorModal";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

export function ActorsStyleClient({ style }: { style: string }) {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchActors = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/topxx/search?type=actors&keyword=${encodeURIComponent(style)}`);
        if (!res.ok) throw new Error("Could not fetch talent");
        const data = await res.json();
        setActors(data.items || []);
      } catch (err: any) {
        console.error(err);
        setError("Unable to sync elite talent directory.");
      } finally {
        setLoading(false);
      }
    };
    fetchActors();
  }, [style]);

  const handleActorClick = (actor: any) => {
    setSelectedActor({
      id: actor.id,
      name: actor.name,
      profilePath: actor.profilePath,
      type: 'topxx'
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-60 gap-8 animate-in fade-in duration-1000">
        <div className="relative">
          <Loader2 className="w-20 h-20 text-yellow-500/20 animate-spin" />
          <div className="absolute inset-0 blur-3xl bg-yellow-500/10 rounded-full animate-pulse" />
        </div>
        <p className="text-foreground/10 text-[10px] font-black uppercase tracking-[1em] italic">Initializing Star Grid...</p>
      </div>
    );
  }

  if (error || actors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-foreground/5 rounded-[60px] bg-foreground/[0.02] space-y-12 text-center px-12">
        <div className="w-24 h-24 rounded-full bg-yellow-500/5 flex items-center justify-center ring-8 ring-yellow-500/[0.02]">
          <Search className="w-10 h-10 text-yellow-500/20" />
        </div>
        <div className="space-y-4">
           <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">No Talent Found</h3>
           <p className="text-foreground/30 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed">
             Our elite scouts are still cataloging "{style}" style performers. <br/> Check back shortly.
           </p>
        </div>
        <a href={`/${TOPXX_PATH}/dien-vien`} className="px-12 py-5 bg-foreground text-background font-black uppercase italic tracking-widest rounded-full hover:bg-yellow-500 transition-all shadow-2xl active-depth scale-90">
             Explore All Stars
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-16">
        {actors.map((actor: any, idx: number) => (
          <button 
            key={actor.id || idx} 
            onClick={() => handleActorClick(actor)}
            className="group flex flex-col items-center gap-6 text-center active-depth outline-none"
          >
            <div className="relative w-full aspect-square rounded-[40px] md:rounded-[60px] overflow-hidden border-2 border-foreground/10 shadow-2xl transition-all duration-700 ring-offset-4 ring-offset-background group-hover:ring-8 group-hover:ring-yellow-500/20 group-hover:border-yellow-500/50 group-hover:-translate-y-6 group-hover:rotate-6">
               {actor.profilePath ? (
                   <img 
                     src={actor.profilePath} 
                     alt={actor.name} 
                     className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-125"
                   />
               ) : (
                   <div className="w-full h-full bg-foreground/10 flex items-center justify-center">
                      <User2 className="w-12 h-12 text-foreground/10" />
                    </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-yellow-500/90 text-black flex items-center justify-center translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-300">
                  <Search className="w-3 h-3" />
               </div>
            </div>
            <div className="space-y-1 px-4">
               <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">Premium Talent</span>
               <h3 className="text-sm md:text-base font-black text-foreground group-hover:text-yellow-500 transition-colors uppercase italic tracking-tighter leading-tight">{actor.name}</h3>
            </div>
          </button>
        ))}
      </div>

      <ActorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actor={selectedActor}
        isXX={true}
      />
    </div>
  );
}
