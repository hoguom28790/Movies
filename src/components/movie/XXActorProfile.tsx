"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Ruler, Smile, User, MapPin, Tv, Play, TrendingUp, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

interface XXActorProfileProps {
  actorName: string;
  slug: string;
}

export function XXActorProfile({ actorName, slug }: XXActorProfileProps) {
  const { data: details, isLoading } = useQuery({
    queryKey: ["actor-profile", actorName.toLowerCase()],
    queryFn: async () => {
      const res = await fetch(`/api/javlibrary/actress/${encodeURIComponent(actorName)}`);
      if (!res.ok) throw new Error("Failed to fetch actor details");
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <div className="w-full h-[400px] mb-12 bg-surface/50 rounded-[50px] animate-pulse border border-white/5 flex items-center justify-center">
         <Sparkles className="w-12 h-12 text-primary/20 animate-spin" />
      </div>
    );
  }

  const displayDetails = details || {
    stageName: actorName,
    source: "FALLBACK",
    profileImage: `https://via.placeholder.com/300x450/0f1115/ffffff?text=${encodeURIComponent(actorName)}`,
    realName: "Đang cập nhật",
    birthDate: "N/A",
    measurements: "N/A",
    height: "N/A",
    birthPlace: "N/A",
    studio: "Elite Art"
  };

  const stats = [
    { label: "Nghệ danh", value: displayDetails.stageName, icon: User },
    { label: "Tên thật", value: displayDetails.realName, icon: Smile },
    { label: "Ngày sinh", value: displayDetails.birthDate, icon: Calendar },
    { label: "Số đo 3 vòng", value: displayDetails.measurements, icon: Ruler },
    { label: "Chiều cao", value: displayDetails.height, icon: Ruler },
    { label: "Quê quán", value: displayDetails.birthPlace, icon: MapPin },
    { label: "Studio", value: displayDetails.studio || "Elite Art", icon: Tv },
  ].filter(s => s.value && s.value !== "N/A" && s.value !== "Đang cập nhật");

  return (
    <div className="relative mb-20 overflow-hidden rounded-[60px] border border-white/5 bg-[#0a0a0b] shadow-2xl group">
      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-110 -z-10"
        style={{ 
          backgroundImage: `url(${displayDetails.profileImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="flex flex-col md:flex-row items-center md:items-end gap-12 p-10 md:p-16">
        <div className="w-56 h-56 md:w-72 md:h-72 rounded-[56px] overflow-hidden border-[8px] border-white/5 shadow-2xl flex-shrink-0 relative">
          <img 
            src={displayDetails.profileImage} 
            alt={actorName} 
            className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
            onError={(e) => { (e.target as any).src = `https://via.placeholder.com/300x450/0f1115/ffffff?text=${encodeURIComponent(actorName)}` }}
          />
        </div>

        <div className="flex-grow space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <span className="text-[12px] font-black text-primary uppercase italic tracking-[0.5em] block animate-in fade-in slide-in-from-left-5 duration-700">
               {displayDetails.source?.includes('javlibrary') ? 'JAVLIB SYNC' : 'ELITE ARCHIVE'}
            </span>
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-4 mb-6">
              <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] drop-shadow-2xl">
                {actorName}
              </h1>
              {!details && (
                <span className="px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-black uppercase tracking-widest italic animate-pulse">
                  Protected Info
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6 pt-6 border-t border-white/5">
            {stats.length > 0 ? stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">{stat.label}</span>
                <span className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter truncate">
                  {stat.value}
                </span>
              </div>
            )) : (
              <div className="col-span-full py-4">
                <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.5em] italic">Đang đồng bộ hóa kho lưu trữ...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
