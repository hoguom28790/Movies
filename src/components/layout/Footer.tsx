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
  // Footer completely removed as requested
  return null;
}
