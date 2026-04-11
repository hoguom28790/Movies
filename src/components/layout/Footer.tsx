"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TOPXX_PATH } from "@/lib/constants";
import { getLunarAuthPass } from "@/lib/lunar";

const columns = [
  {
    title: "DANH MỤC",
    links: [
      { href: "/phim-bo", label: "Phim Bộ" },
      { href: "/phim-le", label: "Phim Lẻ" },
      { href: "/the-loai/long-tieng", label: "Phim Lồng Tiếng" },
      { href: "/the-loai/thuyet-minh", label: "Phim Thuyết Minh" },
      { href: "/the-loai/hoat-hinh", label: "Phim Hoạt Hình" },
    ],
  },
  {
    title: "THỂ LOẠI",
    links: [
      { href: "/the-loai/hanh-dong", label: "Hành Động" },
      { href: "/the-loai/lich-su", label: "Lịch Sử" },
      { href: "/the-loai/co-trang", label: "Cổ Trang" },
      { href: "/the-loai/chien-tranh", label: "Chiến Tranh" },
      { href: "/the-loai/vien-tuong", label: "Viễn Tưởng" },
    ],
  },
  {
    title: "QUỐC GIA",
    links: [
      { href: "/quoc-gia/han-quoc", label: "Hàn Quốc" },
      { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
      { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
      { href: "/quoc-gia/nhat-ban", label: "Nhật Bản" },
      { href: "/quoc-gia/thai-lan", label: "Thái Lan" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const isXX = pathname.startsWith(`/${TOPXX_PATH}`);

  const handleSecretEntry = (e: React.MouseEvent) => {
    e.preventDefault();
    const pass = getLunarAuthPass();
    const input = prompt("Nhập mã xác thực rạp phim (DDMMYYYY):");
    
    if (input === pass) {
      router.push(`/${TOPXX_PATH}`);
    } else if (input !== null) {
      alert("Mã xác thực không chính xác.");
    }
  };

  return (
    <footer className="w-full bg-background/80 backdrop-blur-3xl border-t border-foreground/5 py-12 md:py-20 mt-12 sm:mt-24 no-theme-transition">
      <div className="container mx-auto px-4 md:px-12 lg:px-24">
        {/* Main Footer Content */}
        {!isXX && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12 mb-16 md:mb-24">
            {/* Branding Column */}
            <div className="col-span-2 md:col-span-1 space-y-6">
              <Link href="/" className="flex items-center gap-3 active-depth group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:rotate-12 transition-transform">
                  <span className="text-white font-black text-xl italic leading-none">H</span>
                </div>
                <span className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Hồ Phim</span>
              </Link>
              <p className="text-foreground/30 text-xs font-semibold leading-loose max-w-[200px] uppercase tracking-widest italic">
                Trải nghiệm rạp phim tại gia với chất lượng tuyệt đỉnh và tốc độ sấm sét.
              </p>
            </div>

            {/* Navigation Columns */}
            {columns.map((col) => (
              <div key={col.title} className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">{col.title}</h3>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="text-[13px] font-bold text-foreground/40 hover:text-primary transition-all hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t border-foreground/5 pt-10">
          <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.3em] flex items-center gap-2">
            <span>© 2026 HỒ PHIM.</span>
            <span 
              onClick={handleSecretEntry}
              className="hover:text-primary transition-colors cursor-pointer select-none"
            >
              ALL RIGHTS RESERVED.
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[10px] font-bold text-foreground/30 hover:text-primary tracking-widest uppercase italic transition-colors">Quyền riêng tư</Link>
            <Link href="/terms" className="text-[10px] font-bold text-foreground/30 hover:text-primary tracking-widest uppercase italic transition-colors">Điều khoản</Link>
            <div className="h-4 w-[1px] bg-foreground/10" />
            <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full italic">V4.2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
