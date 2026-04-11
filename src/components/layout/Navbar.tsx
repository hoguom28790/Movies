"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Heart, History as HistoryIcon, BookOpen, Film, LogIn, ChevronRight, X } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstantSearch } from "./InstantSearch";
import { ProfileDropdown } from "./ProfileDropdown";
import { ComicFilters } from "@/components/comic/ComicFilters";
import { AuthModal } from "@/components/auth/AuthModal";
import { TOPXX_PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavbarProps {
  mode?: "phim" | "truyen";
}

export function Navbar({ mode: initialMode }: NavbarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setIsScrolled(latest > 20);
    if (latest > previous && latest > 150) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  });
  
  if (pathname.startsWith(`/${TOPXX_PATH}`)) return null;
  
  const isComicSection = initialMode === "truyen" || pathname.startsWith("/truyen") || pathname.startsWith("/doc");
  
  // Detect if on a TopXX watch page
  const slug = pathname.startsWith("/xem/") ? pathname.split("/").pop() : "";
  const isTopXXSource = searchParams.get("src") === "topxx" || searchParams.get("src") === "avdb";
  const isTopXXSection = pathname.startsWith("/xem/") && (isTopXXSource || /^[A-Z]{2,5}-\d{2,6}$/i.test(slug || "") || (slug ? /^[a-zA-Z0-9]{10}$/.test(slug) : false));

  const isHome = pathname === "/" || pathname === "/truyen";

  return (
    <>
      <motion.header 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 },
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 z-[60] w-full apple-transition",
          "backdrop-blur-2xl bg-background/80",
          isScrolled ? "apple-nav-separator shadow-sm" : ""
        )}
      >
        <div className="mx-auto px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          {/* Logo - SF style */}
          <Link href={isComicSection ? "/truyen" : "/"} className="flex items-center gap-2 group flex-shrink-0">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md">
                {isComicSection ? <BookOpen size={20} fill="currentColor" strokeWidth={0} /> : <Film size={20} fill="currentColor" strokeWidth={0} />}
             </div>
             <span className={cn(
               "text-lg font-bold tracking-tight text-foreground",
               "font-sans" // Use SF Pro
             )}>
                {isComicSection ? "Hồ Truyện" : "Hồ Phim"}
             </span>
          </Link>

          {/* Search Pill - iOS Style */}
          <div className="hidden md:flex flex-1 max-w-lg justify-center px-4">
            <InstantSearch />
          </div>

          {/* Mobile Search Input Overlay */}
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-[70] bg-background px-4 flex items-center md:hidden"
            >
              <div className="flex-1">
                <InstantSearch />
              </div>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 p-2 text-foreground-secondary"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full text-foreground-secondary hover:bg-surface transition-colors md:hidden"
            >
              <Search size={20} />
            </button>

            <Link
              href={isTopXXSection ? `/${TOPXX_PATH}/lich-su` : (isComicSection ? "/truyen/lich-su" : "/lich-su")}
              className="p-2 rounded-full text-foreground-secondary hover:bg-surface transition-colors"
            >
              <HistoryIcon size={20} />
            </Link>

            <Link
              href={isTopXXSection ? `/${TOPXX_PATH}/yeu-thich` : (isComicSection ? "/truyen/yeu-thich" : "/yeu-thich")}
              className="p-2 rounded-full text-foreground-secondary hover:bg-surface transition-colors"
            >
              <Heart 
                size={20} 
                fill={(pathname.includes("yeu-thich")) ? "currentColor" : "none"} 
                className={pathname.includes("yeu-thich") ? "text-primary" : ""}
              />
            </Link>

            <div className="h-4 w-[1px] bg-separator mx-1" />

            <ThemeToggle />

            {user ? (
               <ProfileDropdown />
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="ml-2 px-4 h-9 rounded-full bg-primary text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
