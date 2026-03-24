"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, History as HistoryIcon, BookOpen, Film, LogIn, ChevronRight } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstantSearch } from "./InstantSearch";
import { NavMenu } from "./NavMenu";
import { ProfileDropdown } from "./ProfileDropdown";
import { ComicFilters } from "@/components/comic/ComicFilters";
import { AuthModal } from "@/components/auth/AuthModal";
import { TOPXX_PATH } from "@/lib/constants";

interface NavbarProps {
  mode?: "phim" | "truyen";
}

export function Navbar({ mode: initialMode }: NavbarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setIsScrolled(latest > 50);
    if (latest > previous && latest > 150) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  });
  
  const isComicSection = initialMode === "truyen" || pathname.startsWith("/truyen") || pathname.startsWith("/doc");
  const mode = isComicSection ? "truyen" : "phim";

  if (pathname.startsWith("/v2k9r5w8m3x7n1p4q0z6") || pathname.startsWith(`/${TOPXX_PATH}`)) return null;

  return (
    <>
      <motion.header 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 },
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 z-[60] w-full pt-safe pointer-events-none"
      >
        <div className="mx-auto px-4 md:px-10 lg:px-16 py-4">
          <div className={`
            glass-pro rounded-[28px] px-6 md:px-8 h-20 flex items-center justify-between gap-6 pointer-events-auto
            transition-all duration-700
            ${isScrolled ? 'shadow-cinematic-xl' : 'shadow-none'}
          `}>
            {/* Logo */}
            <Link href={isComicSection ? "/truyen" : "/"} className="flex items-center gap-3 group flex-shrink-0">
               <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform duration-500">
                  {isComicSection ? <BookOpen className="w-6 h-6 text-white" /> : <Film className="w-6 h-6 text-white" />}
               </div>
               <span className="text-2xl md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 font-headline uppercase italic leading-none transition-all group-hover:tracking-normal">
                  {isComicSection ? "Hồ Truyện" : "Hồ Phim"}
               </span>
            </Link>

            <div className="hidden lg:flex items-center gap-2 flex-1 justify-center">
              <NavMenu mode={mode as any} />
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden xl:flex items-center gap-2 mr-2">
                {isComicSection ? (
                  <Link href="/" className="group flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-[11px] font-black uppercase tracking-widest italic transition-all active-depth">
                    <Film className="w-4 h-4 text-primary" /> Phim <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link href="/truyen" className="group flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-black uppercase tracking-widest italic transition-all active-depth shadow-sm">
                    <BookOpen className="w-4 h-4" /> Truyện <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
              
              {isComicSection && (
                <div className="hidden sm:block mr-2">
                  <Suspense fallback={<div className="w-24 h-10 bg-white/5 animate-pulse rounded-2xl" />}>
                    <ComicFilters />
                  </Suspense>
                </div>
              )}
              
              <div className="hidden lg:block w-56 xl:w-72">
                <InstantSearch />
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Link
                  href={isComicSection ? "/truyen/search" : "/search"}
                  className="p-3 rounded-2xl text-foreground/70 hover:text-primary hover:bg-primary/10 transition-all active-depth"
                  title="Tìm kiếm"
                >
                  <Search className="h-5 w-5 stroke-[2.5px]" />
                </Link>
                
                <Link
                  href={isComicSection ? "/truyen/lich-su" : "/lich-su"}
                  className={`p-3 rounded-2xl transition-all active-depth ${
                    (pathname === "/lich-su" || pathname === "/truyen/lich-su") ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                  title="Lịch sử"
                >
                  <HistoryIcon className="h-5 w-5 stroke-[2.5px]" />
                </Link>

                <div className="hidden xs:block">
                  <ThemeToggle />
                </div>

                <Link
                  href={isComicSection ? "/truyen/yeu-thich" : "/yeu-thich"}
                  className={`p-3 rounded-2xl transition-all active-depth ${
                    (pathname === "/yeu-thich" || pathname === "/truyen/yeu-thich") ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                  title="Yêu thích"
                >
                  <Heart className={`h-5 w-5 stroke-[2.5px] ${ (pathname === "/yeu-thich" || pathname === "/truyen/yeu-thich") ? "fill-current" : ""}`} />
                </Link>

                {user ? (
                   <div className="ml-2 pl-4 border-l border-white/10 hidden sm:block">
                      <ProfileDropdown />
                   </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="ml-2 group flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[11px] font-black uppercase tracking-[0.2em] italic transition-all active-depth shadow-lg shadow-primary/30"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
