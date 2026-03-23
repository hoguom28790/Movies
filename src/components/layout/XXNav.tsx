"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, Star, History, Heart, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { XXSearch } from "./XXSearch";

// Official codes from TopXX API
const GENRES = [
  { name: "Việt Sub", slug: "NMf5df5FMg", icon: "🇻🇳" },
  { name: "Không Che", slug: "vdDkXwQsHi", icon: "🔞" },
  { name: "JAV (Nhật)", slug: "vQMGvwTw5G", icon: "🇯🇵" },
  { name: "Hentai 18+", slug: "NqlIpFB5ov", icon: "🎨" },
  { name: "Tập thể", slug: "1UhBBr5pNM", icon: "👨‍👩‍👧‍👦" },
  { name: "Âu Mỹ", slug: "oHJZdhXKfM", icon: "🇺🇸" },
  { name: "Xnxx", slug: "bXBvvD9LsZ", icon: "🔥" },
  { name: "Sex 3D", slug: "8Vfsvu32pK", icon: "🧊" },
];

const COUNTRIES = [
  { name: "Nhật Bản", slug: "jp", icon: "🇯🇵" },
  { name: "Việt Nam", slug: "vn", icon: "🇻🇳" },
  { name: "Trung Quốc", slug: "cn", icon: "🇨🇳" },
  { name: "Mỹ", slug: "us", icon: "🇺🇸" },
  { name: "Hàn Quốc", slug: "KR", icon: "🇰🇷" },
  { name: "Nga", slug: "ru", icon: "🇷🇺" },
];

interface DropdownConfig {
  id: string;
  label: string;
  items: { name: string; slug: string; icon?: string }[];
  basePath: string;
}

const dropdowns: DropdownConfig[] = [
  { id: "genre", label: "Categories", items: GENRES, basePath: "/v2k9r5w8m3x7n1p4q0z6/the-loai" },
  { id: "country", label: "World", items: COUNTRIES, basePath: "/v2k9r5w8m3x7n1p4q0z6/quoc-gia" },
];

const directLinks = [
  { label: "Việt Sub", href: "/v2k9r5w8m3x7n1p4q0z6/the-loai/NMf5df5FMg", icon: <Star className="w-3.5 h-3.5" /> },
  { label: "Nhật Bản", href: "/v2k9r5w8m3x7n1p4q0z6/quoc-gia/jp", icon: <Star className="w-3.5 h-3.5" /> },
  { label: "Không che", href: "/v2k9r5w8m3x7n1p4q0z6/the-loai/vdDkXwQsHi", icon: <Star className="w-3.5 h-3.5" /> },
  { label: "Diễn viên", href: "/v2k9r5w8m3x7n1p4q0z6/dien-vien", icon: <User className="w-3.5 h-3.5" /> },
  { label: "Thư viện", href: "/v2k9r5w8m3x7n1p4q0z6/yeu-thich", icon: <Heart className="w-3.5 h-3.5" /> },
  { label: "Lịch sử", href: "/v2k9r5w8m3x7n1p4q0z6/lich-su", icon: <History className="w-3.5 h-3.5" /> },
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <nav ref={navRef} className="flex items-center w-full gap-2 relative">
      <div className="md:hidden flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 rounded-2xl bg-white/5 text-white/50 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all active-depth"
        >
          <Menu className="w-6 h-6 stroke-[2.5px]" />
        </button>
      </div>

      <Link
        href="/v2k9r5w8m3x7n1p4q0z6"
        className="group relative flex items-center gap-2 px-4 py-2"
      >
        <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-[length:200%_auto] animate-gradient-x uppercase group-hover:tracking-normal transition-all duration-700">
          TOP XX
        </span>
        <div className="absolute -top-1 -right-2 p-1 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/40 animate-pulse">
           <Sparkles className="w-2.5 h-2.5 text-black" />
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-1 ml-4 py-1.5 px-2 rounded-[24px] bg-white/[0.03] border border-white/5">
        {directLinks.slice(0, 4).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] italic text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-300 active-depth"
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
              className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 rounded-2xl ${
                openId === dd.id ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 font-black" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {dd.label}
              <ChevronDown className={`h-4 w-4 transition-transform duration-500 stroke-[3px] ${openId === dd.id ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {openId === dd.id && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 5, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onMouseEnter={clearCloseTimer}
                  onMouseLeave={scheduleClose}
                  className="absolute top-full left-0 mt-3 rounded-[32px] glass-pro border border-white/10 shadow-cinematic-xl p-4 z-50 min-w-[280px]"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {dd.items.map((item, idx) => (
                      <motion.div
                        key={item.slug}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Link
                          href={`${dd.basePath}/${item.slug}`}
                          onClick={() => setOpenId(null)}
                          className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase italic tracking-widest text-white/40 hover:text-yellow-500 hover:bg-white/5 rounded-2xl transition-all"
                        >
                          <span className="text-base">{item.icon}</span>
                          {item.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex-1" />
      
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden lg:block h-10 w-[1px] bg-white/5 mx-2" />
        <XXSearch />
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl md:hidden"
          >
            <div className="flex flex-col h-full bg-gradient-to-b from-yellow-500/5 to-transparent">
               <div className="flex items-center justify-between p-8">
                  <span className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-gradient-x">TOP XX MENU</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-4 bg-white/5 rounded-[20px] text-white/50 active-depth border border-white/5"
                  >
                     <X className="w-7 h-7 stroke-[3px]" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-12">
                  <section className="space-y-6">
                     <div className="flex items-center gap-3 px-2">
                        <div className="h-1.5 w-8 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                        <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[0.4em] italic">Explore</h3>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        {directLinks.map((link, idx) => (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Link 
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] bg-white/5 border border-white/5 text-[12px] font-black text-white/20 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all duration-500 uppercase italic tracking-tighter"
                            >
                               <div className="p-3 rounded-2xl bg-white/5 text-white/40 group-hover:bg-yellow-500 group-hover:text-black transition-all duration-500 shadow-xl">
                                  {link.icon}
                               </div>
                               {link.label}
                            </Link>
                          </motion.div>
                        ))}
                     </div>
                  </section>

                  {dropdowns.map((dd, sectIdx) => (
                    <section key={dd.id} className="space-y-6">
                       <div className="flex items-center gap-3 px-2">
                          <div className="h-1.5 w-8 rounded-full bg-zinc-800" />
                          <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[0.4em] italic">{dd.label}</h3>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {dd.items.map((item, idx) => (
                            <motion.div
                              key={item.slug}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (sectIdx + 1) * 0.2 + idx * 0.03 }}
                            >
                              <Link 
                                href={`${dd.basePath}/${item.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] font-black text-white/40 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all uppercase italic tracking-tight"
                              >
                                 <span className="text-lg opacity-80">{item.icon}</span>
                                 {item.name}
                              </Link>
                            </motion.div>
                          ))}
                       </div>
                    </section>
                  ))}
               </div>

               <div className="absolute bottom-8 left-8 right-8 p-6 rounded-[32px] glass-pro border border-white/10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">Premium Experience 2026</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

