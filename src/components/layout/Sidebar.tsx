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
  { icon: Film, label: "Phim Hàn", href: "/quoc-gia/han-quoc" },
  { icon: Film, label: "Phim Trung", href: "/quoc-gia/trung-quoc" },
  { icon: LayoutGrid, label: "Duyệt Tìm", href: "/the-loai" },
  { icon: TrendingUp, label: "Chủ đề", href: "/top-trending" },
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
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                  Active
                    ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20"
                    : "text-white/40 group-hover:bg-white/5 group-hover:text-white/80"
                }`}>
                  <item.icon className={`h-5 w-5 ${Active ? "fill-white" : ""}`} strokeWidth={Active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold transition-all duration-300 ${
                  Active ? "text-primary opacity-100" : "text-white/40 opacity-100 group-hover:text-white/80"
                }`}>
                  {item.label}
                </span>
                {Active && (
                  <div className="absolute -left-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_rgba(0,163,255,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mb-8 flex-grow" />

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
