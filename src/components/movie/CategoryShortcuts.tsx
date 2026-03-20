"use client";

import React from "react";
import Link from "next/link";
import { Flame, Monitor, Volume2, MessageSquare, History, Sparkles } from "lucide-react";

const shortcuts = [
  {
    title: "Hot Rần Rần",
    subtitle: "Xem chủ đề >",
    href: "/phim-moi",
    icon: Flame,
    gradient: "from-orange-600 to-red-900",
  },
  {
    title: "Chiếu rạp",
    subtitle: "Xem chủ đề >",
    href: "/the-loai/chieu-rap",
    icon: Monitor,
    gradient: "from-blue-600 to-indigo-900",
  },
  {
    title: "Lồng tiếng",
    subtitle: "Xem chủ đề >",
    href: "/the-loai/long-tieng",
    icon: Volume2,
    gradient: "from-purple-600 to-fuchsia-900",
  },
  {
    title: "Thuyết Minh",
    subtitle: "Xem chủ đề >",
    href: "/the-loai/thuyet-minh",
    icon: MessageSquare,
    gradient: "from-emerald-600 to-teal-900",
  },
  {
    title: "Cổ trang",
    subtitle: "Xem chủ đề >",
    href: "/the-loai/co-trang",
    icon: Sparkles,
    gradient: "from-indigo-600 to-blue-900",
  },
];

export function CategoryShortcuts() {
  return (
    <section className="container mx-auto px-4 lg:px-8 mt-12 mb-16">
      <h3 className="text-xl font-black text-white mb-6">Bạn đang quan tâm gì?</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {shortcuts.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className={`group relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${item.gradient} shadow-lg hover:shadow-primary/20`}
          >
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="flex justify-between items-start">
                <item.icon className="h-6 w-6 text-white/40 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-black text-white">{item.title}</h4>
                <p className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">{item.subtitle}</p>
              </div>
            </div>
            
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
               <item.icon className="h-24 w-24 text-white" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
