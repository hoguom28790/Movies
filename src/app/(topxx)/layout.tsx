"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, LogOut, User, Home, History as HistoryIcon, Heart, Search } from "lucide-react";
import { TOPXX_PATH } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";
import { getLunarAuthPass } from "@/lib/lunar";
import { XXInstantSearch } from "@/components/layout/XXInstantSearch";
import { useUserTheme } from "@/hooks/useUserTheme";

export default function TopXXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useUserTheme();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // FORCE FIXED flash on TopXX only - Immediate theme sync from Firebase/Storage
  React.useEffect(() => {
    setMounted(true);
    // Force set theme if on TopXX to ensure no flash
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("hophim-theme");
      if (savedTheme && savedTheme !== theme) {
        // Remove quotes if any from localStorage string
        const cleanTheme = savedTheme.replace(/"/g, "");
        if (["light", "dark", "system"].includes(cleanTheme)) {
           setTheme(cleanTheme as any);
        }
      }
    }
  }, [setTheme, theme]);

  React.useEffect(() => {
    // TEMPORARY: Disable password requirement as per user request
    setIsAuthorized(true);
    /*
    const authStatus = localStorage.getItem("topxx_authorized");
    if (authStatus === "true") {
      setIsAuthorized(true);
      return;
    }

    const correctPass = getLunarAuthPass();
    const pass = window.prompt("⚠️ TopXX Restricted Area\nNhập mật mã để tiếp tục:");
    
    if (pass === correctPass) {
      localStorage.setItem("topxx_authorized", "true");
      setIsAuthorized(true);
    } else {
      alert("❌ Mật mã không chính xác!");
      router.push("/");
    }
    */
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-black uppercase tracking-[0.4em] text-foreground/20 animate-pulse">
        Lệnh cấm: Truy cập trái phép
      </div>
    );
  }

  return (
    <div className={`theme-xx min-h-screen bg-background text-foreground ${!mounted ? "opacity-0" : "animate-in fade-in duration-500"} transition-none`}>
      {/* 18+ Warning Banner */}
      <div className="bg-amber-500 text-black py-2 px-4 flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest z-[1100] relative">
        <AlertCircle className="w-4 h-4" />
        Nội dung 18+ - Chỉ dành cho người lớn - Cân nhắc trước khi xem
      </div>

      <div className="flex flex-col">
        <header className="fixed top-9 z-[1000] w-full border-b border-foreground/[0.06] bg-surface/90 backdrop-blur-xl pt-safe font-black italic">
          <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
            <Link href={`/${TOPXX_PATH}`} className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter text-foreground font-headline italic">TopXX <span className="text-primary not-italic">🎬</span></span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
              <XXInstantSearch />
              
              <Link href={`/${TOPXX_PATH}`} className={`p-2 transition-colors ${pathname === `/${TOPXX_PATH}` ? "text-primary" : "text-foreground/60 hover:text-primary"}`}>
                <Home className="w-5 h-5" />
              </Link>
              <Link href={`/${TOPXX_PATH}/lich-su`} className={`p-2 transition-colors ${pathname.includes('/lich-su') ? "text-primary" : "text-foreground/60 hover:text-primary"}`}>
                <HistoryIcon className="w-5 h-5" />
              </Link>
              <Link href={`/${TOPXX_PATH}/yeu-thich`} className={`p-2 transition-colors ${pathname.includes('/yeu-thich') ? "text-primary" : "text-foreground/60 hover:text-primary"}`}>
                <Heart className="w-5 h-5" />
              </Link>
              <Link href="/settings" className="p-2 text-foreground/60 hover:text-primary transition-colors hidden sm:block">
                <User className="w-5 h-5" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-grow pt-32 pb-safe px-4 lg:px-12">
          {children}
        </main>
        
        <footer className="py-20 border-t border-foreground/[0.06] bg-surface text-center">
          <div className="container mx-auto px-4">
             <span className="text-xl font-black italic tracking-tighter text-primary mb-4 block">TopXX</span>
             <p className="text-foreground/20 text-[12px] max-w-md mx-auto mb-8 font-black uppercase tracking-widest">
               Nội dung được cung cấp chỉ dành cho mục đích cá nhân. Vui lòng không chia sẻ cho người dưới 18 tuổi.
             </p>
             <Link href="/" className="text-primary hover:text-primary-hover font-bold text-sm underline underline-offset-4">
                Quay lại Hồ Phim
             </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
