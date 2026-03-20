"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserCircle, LogOut, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { InstantSearch } from "./InstantSearch";
import { NavMenu } from "./NavMenu";

export function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group mr-6 flex-shrink-0">
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
            <div className="hidden md:block w-56 lg:w-72">
              <InstantSearch />
            </div>
            <Link
              href="/search"
              className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/watchlist"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-[12px] font-medium transition-all"
                >
                  <Heart className="h-3.5 w-3.5" />
                  Yêu thích
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[12px] font-semibold transition-all"
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
