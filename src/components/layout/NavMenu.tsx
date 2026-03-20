"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const GENRES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Hài Hước", slug: "hai-huoc" },
  { name: "Cổ Trang", slug: "co-trang" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Hình Sự", slug: "hinh-su" },
  { name: "Chiến Tranh", slug: "chien-tranh" },
  { name: "Viễn Tưởng", slug: "vien-tuong" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Hoạt Hình", slug: "hoat-hinh" },
  { name: "Phiêu Lưu", slug: "phieu-luu" },
  { name: "Khoa Học", slug: "khoa-hoc" },
  { name: "Âm Nhạc", slug: "am-nhac" },
  { name: "Thể Thao", slug: "the-thao" },
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
];

const YEARS = Array.from({ length: 8 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { name: String(y), slug: String(y) };
});

interface DropdownProps {
  label: string;
  items: { name: string; slug: string }[];
  basePath: string;
}

function Dropdown({ label, items, basePath }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-[#141416] border border-white/[0.08] shadow-2xl shadow-black/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-h-80 overflow-y-auto px-1">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`${basePath}/${item.slug}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const directLinks = [
  { label: "Phim Lẻ", href: "/phim-le" },
  { label: "Phim Bộ", href: "/phim-bo" },
  { label: "Hoạt Hình", href: "/hoat-hinh" },
  { label: "TV Shows", href: "/tv-shows" },
];

export function NavMenu() {
  return (
    <nav className="flex items-center gap-0.5">
      <Dropdown label="Thể loại" items={GENRES} basePath="/the-loai" />
      <Dropdown label="Quốc gia" items={COUNTRIES} basePath="/quoc-gia" />
      <Dropdown label="Năm" items={YEARS} basePath="/nam" />
      
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
