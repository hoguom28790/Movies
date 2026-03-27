"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getTMDBImageUrl } from "@/services/tmdb";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

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
    <section className="mt-12 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-xl font-bold text-foreground">Diễn viên</h3>
        {actors.length > 8 && (
          <span className="text-[10px] text-foreground-secondary font-bold uppercase tracking-widest hidden sm:inline">Vuốt để xem thêm</span>
        )}
      </div>
      
      <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar snap-x snap-mandatory px-1">
        {actors.slice(0, 15).map((actor: any, idx: number) => (
          <div 
            key={idx} 
            className="flex-shrink-0 w-24 sm:w-28 snap-start cursor-pointer group"
            onClick={() => handleActorClick(actor)}
          >
            <div className="relative aspect-square rounded-full overflow-hidden mb-3 shadow-md group-hover:shadow-lg group-hover:scale-[1.05] transition-all duration-500 bg-surface">
              {actor.profile_path ? (
                <Image
                  src={getTMDBImageUrl(actor.profile_path, 'w185') || ""}
                  alt={actor.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  sizes="(max-width: 640px) 96px, 112px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground-secondary text-2xl font-bold">
                  {actor.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center">
              <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {actor.name}
              </h4>
              <p className="text-[10px] text-foreground-secondary font-medium line-clamp-1">
                {actor.character || "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ActorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actor={selectedActor}
      />
    </section>
  );
}
