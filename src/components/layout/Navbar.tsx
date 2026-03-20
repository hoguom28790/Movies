"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserCircle, LogOut, Menu, X, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { InstantSearch } from "./InstantSearch";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/phim-le", label: "Phim Lẻ" },
  { href: "/phim-bo", label: "Phim Bộ" },
  { href: "/the-loai", label: "Thể Loại" },
  { href: "/phim-moi", label: "Phim Mới" },
];

export function Navbar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group mr-8">
            <span className="text-2xl font-black text-primary uppercase tracking-tighter transition-transform group-hover:scale-105">
              Hồ Phim
            </span>
          </Link>

          {/* Search Bar - Center (Phimleak style) */}
          <InstantSearch />

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="md:hidden p-2 transition-colors text-white/70 hover:text-white"
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/watchlist"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  <Heart className="h-4 w-4 text-primary" />
                  Yêu thích
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-primary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
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

