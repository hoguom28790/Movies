"use client";

import Link from "next/link";
import { Star, User } from "lucide-react";

interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
}

export function ActorGallery({ actors }: { actors: Actor[] }) {
  if (!actors || actors.length === 0) return null;

  // Limit to top 12 actors for the gallery
  const displayedActors = actors.slice(0, 12);

  return (
    <section className="mt-12">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full" />
        Diễn Viên Chính
      </h3>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
        {displayedActors.map((actor) => (
          <Link 
            key={actor.id} 
            href={`/dien-vien/${actor.id}`}
            className="flex-shrink-0 w-28 md:w-32 group"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-primary/50 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
              {actor.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                  alt={actor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                  <User className="w-10 h-10 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{actor.name}</p>
              {actor.character && (
                <p className="text-[10px] text-white/40 uppercase tracking-tighter line-clamp-1 mt-0.5">{actor.character}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
