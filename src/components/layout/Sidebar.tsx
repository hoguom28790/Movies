"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Film, 
  Tv, 
  LayoutGrid, 
  Heart, 
  History, 
  TrendingUp, 
  Flame
} from "lucide-react";

const menuItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Film, label: "Phim Lẻ", href: "/phim-le" },
  { icon: Tv, label: "Phim Bộ", href: "/phim-bo" },
  { icon: LayoutGrid, label: "Thể Loại", href: "/the-loai" },
  { icon: Heart, label: "Yêu Thích", href: "/watchlist" },
  { icon: History, label: "Lịch Sử", href: "/history" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => 
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col items-center border-r border-white/5 bg-black/60 pt-20 backdrop-blur-3xl md:flex">
        <nav className="flex flex-1 flex-col items-center gap-8 px-2">
          {menuItems.map((item) => {
            const Active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-center gap-1 transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                  Active 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                    : "text-white/40 group-hover:bg-white/5 group-hover:text-white"
                }`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tighter transition-opacity duration-300 ${
                  Active ? "text-primary opacity-100" : "text-white/20 opacity-0 group-hover:opacity-100"
                }`}>
                  {item.label}
                </span>
                {Active && (
                  <div className="absolute -left-4 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_#ff4d4d]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mb-8 flex flex-col items-center gap-4">
          <Link href="/top-trending" className="group">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-orange-500/10 hover:text-orange-500">
               <Flame className="h-5 w-5" />
             </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/5 bg-black/80 px-4 backdrop-blur-2xl md:hidden">
        {menuItems.slice(0, 5).map((item) => {
          const Active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                Active ? "text-primary" : "text-white/40"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
