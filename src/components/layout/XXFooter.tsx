"use client";

import React from "react";
import Link from "next/link";

const columns = [
  {
    title: "KHÁM PHÁ",
    links: [
      { href: "/xx/the-loai/NMf5df5FMg", label: "Phim Việt Sub" },
      { href: "/xx/the-loai/vdDkXwQsHi", label: "Phim Không Che" },
      { href: "/xx/the-loai/vQMGvwTw5G", label: "JAV (Nhật Bản)" },
      { href: "/xx/the-loai/NqlIpFB5ov", label: "Hentai 18+" },
      { href: "/xx/the-loai/1UhBBr5pNM", label: "Phim Tập Thể" },
    ],
  },
  {
    title: "THỂ LOẠI",
    links: [
      { href: "/xx/the-loai/oHJZdhXKfM", label: "Âu Mỹ" },
      { href: "/xx/the-loai/bXBvvD9LsZ", label: "Xnxx" },
      { href: "/xx/the-loai/8Vfsvu32pK", label: "Sex 3D" },
      { href: "/xx/dien-vien", label: "Diễn Viên" },
      { href: "/xx/nguon/avdb", label: "AVDB Premium" },
    ],
  },
  {
    title: "QUỐC GIA",
    links: [
      { href: "/xx/quoc-gia/jp", label: "Nhật Bản" },
      { href: "/xx/quoc-gia/vn", label: "Việt Nam" },
      { href: "/xx/quoc-gia/cn", label: "Trung Quốc" },
      { href: "/xx/quoc-gia/us", label: "Mỹ" },
      { href: "/xx/quoc-gia/KR", label: "Hàn Quốc" },
    ],
  },
  {
    title: "TÀI KHOẢN",
    links: [
      { href: "/xx/yeu-thich", label: "Thư Viện" },
      { href: "/xx/lich-su", label: "Lịch Sử Xem" },
      { href: "/", label: "Hồ Phim Chính" },
    ],
  },
];

export function XXFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0a] mt-20 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 italic">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-bold text-white/40 hover:text-yellow-500 transition-all uppercase italic tracking-tighter"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase">TopXX Premium</span>
            <p className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Trải nghiệm phim cao cấp thế hệ mới</p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/xx" className="text-[11px] font-black text-white/30 hover:text-yellow-500 transition-colors uppercase tracking-widest italic">
              Home
            </Link>
            <Link href="/xx/the-loai" className="text-[11px] font-black text-white/30 hover:text-yellow-500 transition-colors uppercase tracking-widest italic">
              Genres
            </Link>
            <Link href="/xx/lich-su" className="text-[11px] font-black text-white/30 hover:text-yellow-500 transition-colors uppercase tracking-widest italic">
              History
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center md:text-left">
           <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.5em]">© {new Date().getFullYear()} TOPXX - ALL RIGHTS RESERVED</p>
        </div>
      </div>
    </footer>
  );
}
