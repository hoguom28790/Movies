"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
  { id: "genre", label: "Thể loại", items: GENRES, basePath: "/xx/the-loai" },
  { id: "country", label: "Quốc gia", items: COUNTRIES, basePath: "/xx/quoc-gia" },
];

const directLinks = [
  { label: "Việt Sub", href: "/xx/the-loai/NMf5df5FMg" },
  { label: "Nhật Bản", href: "/xx/quoc-gia/jp" },
  { label: "Không che", href: "/xx/the-loai/vdDkXwQsHi" },
  { label: "Nguồn TopXX", href: "/xx/nguon/topxx" },
  { label: "Nguồn AVDB", href: "/xx/nguon/avdb" },
  { label: "Diễn viên", href: "/xx/dien-vien" },
  { label: "Thư viện", href: "/xx/yeu-thich" },
  { label: "Lịch sử", href: "/xx/lich-su" },
];

export function XXNav() {
  const [openId, setOpenId] = useState<string | null>(null);
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

  return (
    <nav ref={navRef} className="flex items-center gap-0.5">
      <Link
        href="/xx"
        className="px-3 py-2 text-[14px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-80 transition-opacity"
      >
        TOP XX
      </Link>

      {directLinks.map((link) => (
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
      <div className="flex-1" />
      <div className="ml-auto">
        <XXSearch />
      </div>
    </nav>
  );
}
