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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isXX = pathname.startsWith("/v2k9r5w8m3x7n1p4q0z6");
  const isComic = pathname.startsWith("/truyen") || pathname.startsWith("/doc");

  const navItems = isXX ? [
    { label: "Trang chủ", icon: Home, href: "/v2k9r5w8m3x7n1p4q0z6", activeRegex: /^\/v2k9r5w8m3x7n1p4q0z6$/ },
    { label: "Duyệt Tìm", icon: LayoutGrid, href: "/v2k9r5w8m3x7n1p4q0z6", activeRegex: /^\/v2k9r5w8m3x7n1p4q0z6$/ },
    { label: "Lịch sử", icon: History, href: "/v2k9r5w8m3x7n1p4q0z6/lich-su", activeRegex: /\/lich-su/ },
    { label: "Yêu thích", icon: Heart, href: "/v2k9r5w8m3x7n1p4q0z6/yeu-thich", activeRegex: /\/yeu-thich/ },
  ] : [
    { label: "Trang chủ", icon: Home, href: isComic ? "/truyen" : "/", activeRegex: isComic ? /^\/truyen$/ : /^\/$/ },
    { label: "Duyệt Tìm", icon: LayoutGrid, href: isComic ? "/truyen?genre=all" : "/the-loai", activeRegex: /\/(the-loai|search|truyen\?genre)/ },
    { label: "Lịch sử", icon: History, href: isComic ? "/truyen/lich-su" : "/lich-su", activeRegex: /\/lich-su/ },
    { label: "Yêu thích", icon: Heart, href: isComic ? "/truyen/yeu-thich" : "/yeu-thich", activeRegex: /\/yeu-thich/ },
    { label: isComic ? "Hồ Phim" : "Hồ Truyện", icon: BookOpen, href: isComic ? "/" : "/truyen", activeRegex: isComic ? /^\/(?!truyen|doc|topxx).*/ : /^\/(truyen|doc)/ },
  ];

  return (
    <>
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
