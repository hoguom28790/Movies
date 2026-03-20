"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const GENRES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Viễn Tưởng", slug: "vien-tuong" },
  { name: "Phim 18+", slug: "phim-18" },
  { name: "Phiêu Lưu", slug: "phieu-luu" },
  { name: "Hài Hước", slug: "hai-huoc" },
  { name: "Thần Thoại", slug: "than-thoai" },
  { name: "Lịch Sử", slug: "lich-su" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Âm Nhạc", slug: "am-nhac" },
  { name: "Hình Sự", slug: "hinh-su" },
  { name: "Chính Kịch", slug: "chinh-kich" },
  { name: "Cổ Trang", slug: "co-trang" },
  { name: "Tài Liệu", slug: "tai-lieu" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Gia Đình", slug: "gia-dinh" },
  { name: "Võ Thuật", slug: "vo-thuat" },
  { name: "Kinh Điển", slug: "kinh-dien" },
  { name: "Chiến Tranh", slug: "chien-tranh" },
  { name: "Bí Ẩn", slug: "bi-an" },
  { name: "Thể Thao", slug: "the-thao" },
  { name: "Học Đường", slug: "hoc-duong" },
  { name: "Khoa Học", slug: "khoa-hoc" },
  { name: "Phim Ngắn", slug: "phim-ngan" },
];

const COUNTRIES = [
  { name: "Việt Nam", slug: "viet-nam" },
  { name: "Trung Quốc", slug: "trung-quoc" },
  { name: "Hàn Quốc", slug: "han-quoc" },
  { name: "Nhật Bản", slug: "nhat-ban" },
  { name: "Mỹ", slug: "my" },
  { name: "Thái Lan", slug: "thai-lan" },
  { name: "Ấn Độ", slug: "an-do" },
  { name: "Đài Loan", slug: "dai-loan" },
  { name: "Hồng Kông", slug: "hong-kong" },
];

const YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "Trước 2015"];

export function NavMenu() {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {/* Thể loại */}
      <DropdownMenu label="Thể loại" items={GENRES} type="the-loai" grid />
      
      {/* Quốc gia */}
      <DropdownMenu label="Quốc gia" items={COUNTRIES} type="quoc-gia" />
      
      {/* Năm */}
      <DropdownMenu label="Năm" items={YEARS.map(y => ({ name: y, slug: y }))} type="nam" />
      
      {/* Phim Lẻ */}
      <Link href="/phim-le" className="px-4 py-2 text-[13px] font-bold text-white/70 hover:text-white transition-colors">
        Phim Lẻ
      </Link>
      
      {/* Phim Bộ */}
      <Link href="/phim-bo" className="px-4 py-2 text-[13px] font-bold text-white/70 hover:text-white transition-colors">
        Phim Bộ
      </Link>
      
      {/* Hoạt Hình */}
      <Link href="/the-loai/hoat-hinh" className="px-4 py-2 text-[13px] font-bold text-white/70 hover:text-white transition-colors">
        Hoạt Hình
      </Link>
      
      {/* TV Shows */}
      <Link href="/tv-shows" className="px-4 py-2 text-[13px] font-bold text-white/70 hover:text-white transition-colors">
        TV Shows
      </Link>
    </nav>
  );
}

function DropdownMenu({ label, items, type, grid = false }: { label: string; items: { name: string; slug: string }[]; type: string; grid?: boolean }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 px-4 py-2 text-[13px] font-bold text-white/70 group-hover:text-primary transition-all">
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-40 group-hover:rotate-180 group-hover:opacity-100 transition-all duration-300" />
      </button>

      {/* Dropdown Content */}
      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50`}>
        <div className={`bg-[#0a0a0b]/95 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-2xl p-4 ${grid ? "w-[480px]" : "w-48"}`}>
          <div className={`${grid ? "grid grid-cols-4 gap-x-6 gap-y-2" : "flex flex-col gap-1"}`}>
            {items.map((item) => (
              <Link
                key={item.slug}
                href={type === "the-loai" ? `/the-loai/${item.slug}` : type === "quoc-gia" ? `/quoc-gia/${item.slug}` : `/nam/${item.slug}`}
                className="px-3 py-2 text-[12px] font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
