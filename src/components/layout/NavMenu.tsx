"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const GENRES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Lịch Sử", slug: "lich-su" },
  { name: "Cổ Trang", slug: "co-trang" },
  { name: "Chiến Tranh", slug: "chien-tranh" },
  { name: "Viễn Tưởng", slug: "vien-tuong" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Tài Liệu", slug: "tai-lieu" },
  { name: "Bí Ẩn", slug: "bi-an" },
  { name: "Phim 18+", slug: "phim-18" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Thể Thao", slug: "the-thao" },
  { name: "Phiêu Lưu", slug: "phieu-luu" },
  { name: "Âm Nhạc", slug: "am-nhac" },
  { name: "Gia Đình", slug: "gia-dinh" },
  { name: "Học Đường", slug: "hoc-duong" },
  { name: "Hài Hước", slug: "hai-huoc" },
  { name: "Hình Sự", slug: "hinh-su" },
  { name: "Võ Thuật", slug: "vo-thuat" },
  { name: "Khoa Học", slug: "khoa-hoc" },
  { name: "Thần Thoại", slug: "than-thoai" },
  { name: "Chính Kịch", slug: "chinh-kich" },
  { name: "Kinh Điển", slug: "kinh-dien" },
  { name: "Phim Ngắn", slug: "phim-ngan" },
];

const COUNTRIES = [
  { name: "Hàn Quốc", slug: "han-quoc" },
  { name: "Trung Quốc", slug: "trung-quoc" },
  { name: "Âu Mỹ", slug: "au-my" },
  { name: "Nhật Bản", slug: "nhat-ban" },
  { name: "Thái Lan", slug: "thai-lan" },
  { name: "Đài Loan", slug: "dai-loan" },
  { name: "Ấn Độ", slug: "an-do" },
  { name: "Anh", slug: "anh" },
  { name: "Pháp", slug: "phap" },
  { name: "Việt Nam", slug: "viet-nam" },
  { name: "Hồng Kông", slug: "hong-kong" },
  { name: "Indonesia", slug: "indonesia" },
  { name: "Philippines", slug: "philippines" },
  { name: "Brazil", slug: "brazil" },
  { name: "Tây Ban Nha", slug: "tay-ban-nha" },
  { name: "Đức", slug: "duc" },
];

const YEARS = Array.from({ length: 12 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { name: String(y), slug: String(y) };
});

interface DropdownConfig {
  id: string;
  label: string;
  items: { name: string; slug: string }[];
  basePath: string;
  cols: number;
}

const dropdowns: DropdownConfig[] = [
  { id: "genre", label: "Thể loại", items: GENRES, basePath: "/the-loai", cols: 4 },
  { id: "country", label: "Quốc gia", items: COUNTRIES, basePath: "/quoc-gia", cols: 4 },
  { id: "year", label: "Năm", items: YEARS, basePath: "/nam", cols: 4 },
];

const directLinks = [
  { label: "Truyện Tranh", href: "/truyen" },
  { label: "Phim Lẻ", href: "/phim-le" },
  { label: "Phim Bộ", href: "/phim-bo" },
  { label: "Hoạt Hình", href: "/hoat-hinh" },
  { label: "TV Shows", href: "/tv-shows" },
];

export function NavMenu() {
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
      {dropdowns.map((dd) => (
        <div key={dd.id} className="relative">
          <button
            onClick={() => setOpenId(openId === dd.id ? null : dd.id)}
            onMouseEnter={() => { clearCloseTimer(); setOpenId(dd.id); }}
            onMouseLeave={scheduleClose}
            className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium transition-colors ${
              openId === dd.id ? "text-primary" : "text-white/50 hover:text-white"
            }`}
          >
            {dd.label}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openId === dd.id ? "rotate-180" : ""}`} />
          </button>

          {openId === dd.id && (
            <div
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl bg-[#141416]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ minWidth: `${dd.cols * 140}px` }}
            >
              <div
                className="grid gap-x-2 gap-y-0"
                style={{ gridTemplateColumns: `repeat(${dd.cols}, minmax(0, 1fr))` }}
              >
                {dd.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`${dd.basePath}/${item.slug}`}
                    onClick={(e) => {
                      if (item.slug === "phim-18") {
                        const now = new Date();
                        const dd = String(now.getDate()).padStart(2, "0");
                        const mm = String(now.getMonth() + 1).padStart(2, "0");
                        const yyyy = now.getFullYear();
                        const correctPass = `${dd}${mm}${yyyy}`;
                        
                        const pass = window.prompt(`Nhập mật khẩu để truy cập nội dung 18+:`);
                        if (pass !== correctPass) {
                          e.preventDefault();
                          alert(`Mật khẩu không chính xác!\nBạn đã nhập: ${pass || "không có gì"}\nMật khẩu hôm nay là: ${correctPass}`);
                          return;
                        }
                      }
                      setOpenId(null);
                    }}
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

      {directLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-3 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
