"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Film, 
  LayoutGrid, 
  Heart, 
  History, 
  Sparkles
} from "lucide-react";

const menuItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Film, label: "Phim Hàn", href: "/quoc-gia/han-quoc" },
  { icon: Film, label: "Phim Trung", href: "/quoc-gia/trung-quoc" },
  { icon: LayoutGrid, label: "Duyệt Tìm", href: "/the-loai" },
  { icon: History, label: "Lịch sử", href: "/history" },
  { icon: Heart, label: "Yêu thích", href: "/watchlist" },
];

const mobileItems = [
  { icon: Home, label: "Trang chủ", href: "/", xxHref: "/collection" },
  { icon: LayoutGrid, label: "Duyệt Tìm", href: "/the-loai", xxHref: "/collection/the-loai" },
  { icon: History, label: "Lịch sử", href: "/history", xxHref: "/collection/lich-su" },
  { icon: Heart, label: "Yêu thích", href: "/watchlist", xxHref: "/collection/yeu-thich" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/collection");

  const isActive = (href: string) => 
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col items-center border-r border-white/[0.06] bg-[#0a0a0a] pt-20 md:flex">
        <nav className="flex flex-1 flex-col items-center gap-6 pt-4">
          {(isXX ? [
            { icon: Home, label: "Home", href: "/collection" },
            { icon: LayoutGrid, label: "Thể loại", href: "/collection/the-loai" },
            { icon: History, label: "Lịch sử", href: "/collection/lich-su" },
            { icon: Heart, label: "Thư viện", href: "/collection/yeu-thich" },
          ] : menuItems).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-center gap-1.5 transition-all"
              >
                {/* Left active indicator */}
                {active && (
                  <div className="absolute -left-[14px] top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon 
                  className={`h-[20px] w-[20px] transition-colors ${
                    active ? "text-yellow-500" : "text-white/50 group-hover:text-white/80"
                  }`} 
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className={`text-[10px] font-medium leading-tight transition-colors ${
                  active ? "text-yellow-500" : "text-white/50 group-hover:text-white/80"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-start pt-1.5 justify-around border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((item) => {
          const targetHref = isXX ? item.xxHref : item.href;
          const active = isActive(targetHref);
          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                active ? "text-yellow-500" : "text-white/40"
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
