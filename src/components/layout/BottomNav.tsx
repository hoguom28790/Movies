"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  History, 
  LayoutGrid,
  Heart,
  BookOpen, 
  Zap
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isXX = pathname.startsWith("/topxx");
  const isComic = pathname.startsWith("/truyen") || pathname.startsWith("/doc");

  const navItems = [
    { label: "Trang chủ", icon: Home, href: isXX ? "/topxx" : (isComic ? "/truyen" : "/"), activeRegex: isXX ? /^\/topxx$/ : (isComic ? /^\/truyen$/ : /^\/$/) },
    { label: "Duyệt Tìm", icon: LayoutGrid, href: isXX ? "/topxx/the-loai" : (isComic ? "/truyen?genre=all" : "/the-loai"), activeRegex: /\/(the-loai|search|truyen\?genre)/ },
    { label: "Lịch sử", icon: History, href: isXX ? "/topxx/lich-su" : (isComic ? "/truyen/lich-su" : "/history"), activeRegex: /\/(history|lich-su)/ },
    { label: "Yêu thích", icon: Heart, href: isXX ? "/topxx/yeu-thich" : (isComic ? "/truyen/yeu-thich" : "/watchlist"), activeRegex: /\/(watchlist|yeu-thich)/ },
    { label: isComic ? "Hồ Phim" : "Hồ Truyện", icon: BookOpen, href: isComic ? "/" : "/truyen", activeRegex: isComic ? /^\/(?!truyen|doc|topxx).*/ : /^\/(truyen|doc)/ },
  ];

  return (
    <>
      {/* Floating Action Button for Premium */}
      <button className="fixed right-6 bottom-24 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-[0_8px_25px_rgba(59,130,246,0.4)] flex items-center justify-center z-40 active:scale-95 transition-transform md:hidden">
        <Zap className="w-6 h-6 fill-current" />
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full h-20 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex justify-around items-center px-4 pb-4 z-50 rounded-t-3xl md:hidden">
        {navItems.map((item) => {
          const isActive = item.activeRegex.test(pathname);
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-white/40 hover:text-white/70 active:scale-90"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
              <span className={`text-[10px] font-medium tracking-wide uppercase mt-1 ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
