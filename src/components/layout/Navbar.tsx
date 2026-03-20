"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserCircle, LogOut, Heart, History as HistoryIcon, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { InstantSearch } from "./InstantSearch";
import { NavMenu } from "./NavMenu";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  if (pathname.startsWith("/xx")) return null;

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300 pt-safe">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          {/* Mobile Menu Toggle (Left on Mobile) */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
 
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group md:mr-6 flex-shrink-0">
            <span className="text-xl font-bold text-primary tracking-tight transition-transform group-hover:scale-105">
              Hồ Phim
            </span>
          </Link>

          {/* Center: NavMenu (dropdowns + direct links) */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <NavMenu />
          </div>

          {/* Right: Search + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:block w-48 lg:w-64">
              <InstantSearch />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/watchlist"
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all text-[11px] sm:text-[12px] font-medium ${
                  pathname === "/watchlist" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${pathname === "/watchlist" ? "fill-current" : ""}`} />
                <span className="hidden xs:inline">Yêu thích</span>
              </Link>
              <Link
                href="/history"
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all text-[11px] sm:text-[12px] font-medium ${
                  pathname === "/history" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <HistoryIcon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Lịch sử</span>
              </Link>
              {user && (
                <Link
                  href="/settings"
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all text-[11px] sm:text-[12px] font-medium ${
                    pathname === "/settings" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                  title="Cài đặt"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Cài đặt</span>
                </Link>
              )}
            </div>

            <Link
              href="/search"
              className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <button
                onClick={logout}
                className="p-2 text-white/40 hover:text-white transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="ml-1 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[12px] font-semibold transition-all"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
