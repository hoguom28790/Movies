"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { XXSearch } from "./XXSearch";

// Official codes from TopXX API
const GENRES = [
  { name: "Việt Sub", slug: "NMf5df5FMg" },
  { name: "Không Che", slug: "vdDkXwQsHi" },
  { name: "JAV (Nhật)", slug: "vQMGvwTw5G" },
  { name: "Hentai 18+", slug: "NqlIpFB5ov" },
  { name: "Tập thể", slug: "1UhBBr5pNM" },
  { name: "Âu Mỹ", slug: "oHJZdhXKfM" },
  { name: "Xnxx", slug: "bXBvvD9LsZ" },
  { name: "Sex 3D", slug: "8Vfsvu32pK" },
];

const COUNTRIES = [
  { name: "Nhật Bản", slug: "jp" },
  { name: "Việt Nam", slug: "vn" },
  { name: "Trung Quốc", slug: "cn" },
  { name: "Mỹ", slug: "us" },
  { name: "Hàn Quốc", slug: "KR" },
  { name: "Nga", slug: "ru" },
];

interface DropdownConfig {
  id: string;
  label: string;
  items: { name: string; slug: string }[];
  basePath: string;
}

const dropdowns: DropdownConfig[] = [
  { id: "genre", label: "Thể loại", items: GENRES, basePath: "/v2k9r5w8m3x7n1p4q0z6/the-loai" },
  { id: "country", label: "Quốc gia", items: COUNTRIES, basePath: "/v2k9r5w8m3x7n1p4q0z6/quoc-gia" },
];

const directLinks = [
  { label: "Việt Sub", href: "/v2k9r5w8m3x7n1p4q0z6/the-loai/NMf5df5FMg" },
  { label: "Nhật Bản", href: "/v2k9r5w8m3x7n1p4q0z6/quoc-gia/jp" },
  { label: "Không che", href: "/v2k9r5w8m3x7n1p4q0z6/the-loai/vdDkXwQsHi" },
  { label: "Nguồn TopXX", href: "/v2k9r5w8m3x7n1p4q0z6/nguon/v2k9r5w8m3x7n1p4q0z6" },
  { label: "Nguồn AVDB", href: "/v2k9r5w8m3x7n1p4q0z6/nguon/avdb" },
  { label: "Diễn viên", href: "/v2k9r5w8m3x7n1p4q0z6/dien-vien" },
  { label: "Thư viện", href: "/v2k9r5w8m3x7n1p4q0z6/yeu-thich" },
  { label: "Lịch sử", href: "/v2k9r5w8m3x7n1p4q0z6/lich-su" },
];

export function XXNav() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenId(null), 200);
  }, [clearCloseTimer]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on body scroll or path change
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <nav ref={navRef} className="flex items-center w-full gap-0.5">
      {/* Mobile Hamburger */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden p-2 text-white/50 hover:text-yellow-500 transition-colors mr-2"
      >
        <Menu className="w-6 h-6" />
      </button>

      <Link
        href="/v2k9r5w8m3x7n1p4q0z6"
        className="px-3 py-2 text-[16px] md:text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-80 transition-opacity uppercase italic tracking-tighter"
      >
        TOP XX
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-0.5">
        {directLinks.slice(0, 6).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}

        {dropdowns.map((dd) => (
          <div key={dd.id} className="relative">
            <button
              onClick={() => setOpenId(openId === dd.id ? null : dd.id)}
              onMouseEnter={() => { clearCloseTimer(); setOpenId(dd.id); }}
              onMouseLeave={scheduleClose}
              className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors ${
                openId === dd.id ? "text-yellow-400" : "text-white/50 hover:text-white"
              }`}
            >
              {dd.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openId === dd.id ? "rotate-180" : ""}`} />
            </button>

            {openId === dd.id && (
              <div
                onMouseEnter={clearCloseTimer}
                onMouseLeave={scheduleClose}
                className="absolute top-full left-0 mt-1 rounded-xl bg-[#141416]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 min-w-[160px]"
              >
                <div className="grid gap-1">
                  {dd.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`${dd.basePath}/${item.slug}`}
                      onClick={() => setOpenId(null)}
                      className="px-3 py-2 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1" />
      
      <div className="ml-auto">
        <XXSearch />
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[1000] bg-black transition-all duration-500 ease-in-out md:hidden ${
          isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full">
           <div className="flex items-center justify-between p-6 border-b border-white/5">
              <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">MENU TopXX</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 bg-white/5 rounded-full text-white/50"
              >
                 <X className="w-6 h-6" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-8">
              <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 italic">Dành cho bạn</h3>
                 <div className="grid grid-cols-2 gap-2">
                    {directLinks.map(link => (
                      <Link 
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-4 rounded-xl bg-white/5 border border-white/5 text-[13px] font-bold text-white/70 hover:bg-yellow-500 hover:text-black transition-all uppercase italic tracking-tighter"
                      >
                         {link.label}
                      </Link>
                    ))}
                 </div>
              </section>

              {dropdowns.map(dd => (
                <section key={dd.id} className="space-y-4">
                   <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 italic">{dd.label}</h3>
                   <div className="grid grid-cols-2 gap-2">
                      {dd.items.map(item => (
                        <Link 
                          key={item.slug}
                          href={`${dd.basePath}/${item.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-3 rounded-lg bg-white/[0.02] text-[12px] font-bold text-white/40 hover:text-white"
                        >
                           {item.name}
                        </Link>
                      ))}
                   </div>
                </section>
              ))}
           </div>
        </div>
      </div>
    </nav>
  );
}
