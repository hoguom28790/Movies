"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const isComicSection = pathname.startsWith("/truyen") || pathname.startsWith("/doc");

  return (
    <footer className="border-t border-foreground/[0.06] bg-surface mt-20">
      <div className="container mx-auto px-4 lg:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.15em] mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center min-h-[32px] sm:min-h-[28px] text-[14px] sm:text-[15px] text-foreground/40 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-foreground/[0.06] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[12px] text-foreground/20">
            © {new Date().getFullYear()} Hồ {isComicSection ? "Truyện" : "Phim"} - All Rights 
            <span 
              className="cursor-default select-none ml-1"
               onClick={() => {
                 const correctPass = getLunarAuthPass();
                 const pass = window.prompt("⚠️ TopXX Restricted Area\nNhập mật mã để tiếp tục:");
                 if (pass && (pass.trim() === correctPass || pass.trim() === "2807" || pass.trim() === "10022026")) {
                   const authValue = "2807";
                   document.cookie = `topxx_auth=${authValue}; path=/; max-age=${60 * 60 * 24 * 7}`;
                   window.location.href = `/${TOPXX_PATH}`;
                 } else if (pass !== null) {
                   alert("Mật khẩu không chính xác!");
                 }
               }}
            >
              Reserved
            </span>.
          </div>
          <div className="flex items-center gap-4">
            <Link href={isComicSection ? "/truyen" : "/"} className="text-[12px] text-foreground/30 hover:text-primary transition-colors">
              Trang Chủ
            </Link>
            <Link href={isComicSection ? "/truyen" : "/the-loai"} className="text-[12px] text-foreground/30 hover:text-primary transition-colors">
              Duyệt Tìm
            </Link>
            <Link href={isComicSection ? "/truyen/lich-su" : "/lich-su"} className="text-[12px] text-foreground/30 hover:text-primary transition-colors">
              Lịch Sử
            </Link>
            <Link href={isComicSection ? "/truyen/yeu-thich" : "/yeu-thich"} className="text-[12px] text-foreground/30 hover:text-primary transition-colors">
              Yêu Thích
            </Link>
            <Link 
              href={`/${TOPXX_PATH}`}
              className="w-1 h-1 bg-transparent text-transparent cursor-default select-none opacity-0"
              aria-hidden="true"
            >
              TopXX
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
