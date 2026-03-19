"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserCircle, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthModal } from "@/components/auth/AuthModal";

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
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-black text-primary uppercase tracking-tighter drop-shadow-md">
              Mishane Movies
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 ml-8 flex-1 text-[14px] font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-colors pb-0.5 ${
                  isActive(link.href)
                    ? "text-white after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="p-2 transition-colors text-white/70 hover:text-white"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  href="/history"
                  className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Lịch Sử
                </Link>
                <Link
                  href="/watchlist"
                  className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Yêu Thích
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Cài Đặt
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-primary transition-colors"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all hover:scale-105"
              >
                <UserCircle className="h-4 w-4" />
                Đăng nhập
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-black/70 backdrop-blur-2xl">
            <nav className="flex flex-col px-4 py-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? "bg-primary/20 text-white border-l-2 border-primary"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 mt-3 pt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      href="/history"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-3 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Lịch Sử Xem
                    </Link>
                    <Link
                      href="/watchlist"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-3 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Phim Yêu Thích
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-3 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Cài Đặt (Trakt)
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMobileOpen(false); }}
                      className="px-3 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 text-left transition-all"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsAuthOpen(true); setIsMobileOpen(false); }}
                    className="px-3 py-3 rounded-lg text-sm font-bold bg-primary text-white text-center"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
