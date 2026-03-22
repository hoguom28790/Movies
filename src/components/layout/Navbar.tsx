"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserCircle, LogOut, Heart, History as HistoryIcon, BookOpen, Film } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStylePreset } from "@/contexts/StylePresetContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstantSearch } from "./InstantSearch";
import { NavMenu } from "./NavMenu";
import { MobileMenu } from "./MobileMenu";
import { ProfileDropdown } from "./ProfileDropdown";
import { ComicFilters } from "@/components/comic/ComicFilters";
import { AuthModal } from "@/components/auth/AuthModal";

import { TOPXX_PATH } from "@/lib/constants";

interface NavbarProps {
  mode?: "phim" | "truyen";
}

export function Navbar({ mode: initialMode }: NavbarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  // Use prop if provided, otherwise detect from pathname (for safety)
  const isComicSection = initialMode === "truyen" || pathname.startsWith("/truyen") || pathname.startsWith("/doc");
  const mode = isComicSection ? "truyen" : "phim";

  if (pathname.startsWith("/v2k9r5w8m3x7n1p4q0z6") || pathname.startsWith(`/${TOPXX_PATH}`)) return null;

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300 pt-safe">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="lg:hidden">
            <MobileMenu mode={mode as any} />
          </div>
 
          {/* Logo */}
          <Link href={isComicSection ? "/truyen" : "/"} className="flex items-center gap-2 group md:mr-6 flex-shrink-0">
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary-container font-headline transition-transform group-hover:scale-105">
              {isComicSection ? "Hồ Truyện" : "Hồ Phim"}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <NavMenu mode={mode as any} />
          </div>

          {/* Right: Search + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isComicSection ? (
              <Link href="/" className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 mr-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold transition-all">
                <Film className="w-4 h-4" /> Sang Hồ Phim
              </Link>
            ) : (
              <Link href="/truyen" className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 mr-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-[12px] font-bold transition-all shadow-lg shadow-indigo-500/20">
                <BookOpen className="w-4 h-4" /> Sang Hồ Truyện
              </Link>
            )}
            
            {isComicSection && (
              <div className="hidden sm:block mr-2">
                <Suspense fallback={<div className="w-20 h-8 bg-white/5 animate-pulse rounded-lg" />}>
                  <ComicFilters />
                </Suspense>
              </div>
            )}
            
            <div className="hidden lg:block w-48 lg:w-64">
              <InstantSearch />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href={isComicSection ? "/truyen/search" : "/search"}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Tìm kiếm"
              >
                <Search className="h-5 w-5" />
              </Link>
              
              <Link
                href={isComicSection ? "/truyen/lich-su" : "/lich-su"}
                className={`p-2 rounded-full transition-all ${
                  (pathname === "/lich-su" || pathname === "/truyen/lich-su") ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
                title="Lịch sử"
              >
                <HistoryIcon className="h-5 w-5" />
              </Link>

              <ThemeToggle />

              <Link
                href={isComicSection ? "/truyen/yeu-thich" : "/yeu-thich"}
                className={`p-2 rounded-full transition-all ${
                  (pathname === "/yeu-thich" || pathname === "/truyen/yeu-thich") ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
                title="Yêu thích"
              >
                <Heart className={`h-5 w-5 ${ (pathname === "/yeu-thich" || pathname === "/truyen/yeu-thich") ? "fill-current" : ""}`} />
              </Link>

              {user ? (
                 <div className="ml-1 pl-1 border-l border-white/5">
                    <ProfileDropdown />
                 </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="ml-2 px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-[12px] font-bold transition-all shadow-lg shadow-primary/20"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
