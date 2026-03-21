"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  {
    title: "ĐIỀU KHOẢN",
    links: [
      { href: "/dmca", label: "DMCA" },
      { href: "/lien-he", label: "Liên Hệ" },
      { href: "/gioi-thieu", label: "Giới Thiệu" },
      { href: "/chinh-sach", label: "Chính Sách Riêng Tư" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const isComicSection = pathname.startsWith("/truyen") || pathname.startsWith("/doc");

  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0a] mt-20">
      <div className="container mx-auto px-4 lg:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center min-h-[32px] sm:min-h-[28px] text-[14px] sm:text-[15px] text-white/40 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[12px] text-white/20">
            © {new Date().getFullYear()} Hồ {isComicSection ? "Truyện" : "Phim"} - All Rights 
            <span 
              className="cursor-default select-none"
              onClick={() => {
                const { getLunarDate, formatLunarDate } = require("@/utils/lunar");
                const now = new Date();
                const lunar = getLunarDate(now);
                const correctPass = formatLunarDate(lunar);
                
                const pass = window.prompt("Nhập mật khẩu để tiếp tục:");
                if (pass === correctPass) {
                  window.open("/collection", "_blank");
                } else if (pass !== null) {
                  alert("Mật khẩu không chính xác!");
                }
              }}
            >
              Reserved
            </span>.
          </div>
          <div className="flex items-center gap-4">
            <Link href={isComicSection ? "/truyen" : "/"} className="text-[12px] text-white/30 hover:text-white transition-colors">
              Trang Chủ
            </Link>
            <Link href={isComicSection ? "/truyen" : "/the-loai"} className="text-[12px] text-white/30 hover:text-white transition-colors">
              Duyệt Tìm
            </Link>
            <Link href={isComicSection ? "/truyen/lich-su" : "/lich-su"} className="text-[12px] text-white/30 hover:text-white transition-colors">
              Lịch Sử
            </Link>
            <Link href={isComicSection ? "/truyen/yeu-thich" : "/yeu-thich"} className="text-[12px] text-white/30 hover:text-white transition-colors">
              Yêu Thích
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
