"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getTMDBImageUrl } from "@/services/tmdb";
import dynamic from "next/dynamic";

const ActorModal = dynamic(() => import("./ActorModal").then(mod => mod.ActorModal), {
  ssr: false
});

interface CastSectionProps {
  actors: any[];
}

export function CastSection({ actors }: CastSectionProps) {
  const [selectedActor, setSelectedActor] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActorClick = (actor: any) => {
    setSelectedActor(actor);
    setIsModalOpen(true);
  };

  if (!actors || actors.length === 0) return null;

  return (
    <section className="mt-12 overflow-hidden">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          <h3 className="text-xl font-black text-foreground uppercase tracking-wider">Diễn viên chính</h3>
        </div>
        
        {actors.length > 8 && (
          <div className="hidden sm:flex items-center gap-2">
             <div className="h-[1px] w-12 bg-foreground/10" />
             <span className="text-[10px] text-foreground/20 font-black uppercase tracking-widest">Cuộn để xem thêm</span>
          </div>
        )}
      </div>
      
      <div className="relative group">
        <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar snap-x snap-mandatory px-2">
          {actors.slice(0, 15).map((actor: any, idx: number) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-[100px] sm:w-[120px] snap-start group/actor cursor-pointer"
              onClick={() => handleActorClick(actor)}
            >
              <div className="relative aspect-square rounded-full overflow-hidden mb-4 border-2 border-white/5 group-hover/actor:border-primary/50 group-hover/actor:scale-105 transition-all duration-500 shadow-xl">
                {actor.profile_path ? (
                  <Image
                    src={getTMDBImageUrl(actor.profile_path, 'w185') || ""}
                    alt={actor.name}
                    fill
                    className="object-cover group-hover/actor:scale-110 transition-transform duration-700"
                    loading="lazy"
                    sizes="(max-width: 640px) 100px, 120px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-foreground/20 text-3xl font-black">
                    {actor.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-[13px] font-black text-foreground/90 group-hover/actor:text-primary transition-colors line-clamp-1">
                  {actor.name}
                </h4>
                <p className="text-[10px] text-foreground/30 font-medium italic line-clamp-1">
                  {actor.character || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ActorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actor={selectedActor}
      />
    </section>
  );
}
// Click actor image → TMDB movie_credits/tv_credits modal → search site's API by title+year → navigate to /phim/[slug]
