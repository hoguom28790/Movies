"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ActorAvatarProps {
  name: string;
  initialThumbnail?: string;
  className?: string;
}

export function ActorAvatar({ name, initialThumbnail, className }: ActorAvatarProps) {
  const { data: profileImage, isLoading } = useQuery({
    queryKey: ["actor-avatar", name],
    queryFn: async () => {
      // If we already have the thumbnail, no need to fetch!
      if (initialThumbnail) return initialThumbnail;
      const res = await fetch(`/api/topxx/actress/${encodeURIComponent(name)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.profileImage || null;
    },
    enabled: !initialThumbnail,
    staleTime: 1000 * 60 * 60 * 24, // cache for 24 hours
  });

  const imgSource = initialThumbnail || profileImage;

  if (isLoading && !initialThumbnail) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-foreground/5 animate-pulse"></div>
    );
  }

  if (imgSource) {
    return (
      <img 
        src={imgSource} 
        alt={name} 
        className={cn("w-full h-full object-cover transition-transform duration-500", className)} 
      />
    );
  }

  // Fallback SVG
  return (
    <div className="w-full h-full flex items-center justify-center text-yellow-500/20 bg-yellow-500/5">
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>
  );
}
