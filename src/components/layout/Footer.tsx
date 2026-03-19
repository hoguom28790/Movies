import React from "react";
import Link from "next/link";

const genreLinks = [
  { href: "/the-loai/hanh-dong", label: "Hành Động" },
  { href: "/the-loai/tinh-cam", label: "Tình Cảm" },
  { href: "/the-loai/hai-huoc", label: "Hài Hước" },
  { href: "/the-loai/kinh-di", label: "Kinh Dị" },
  { href: "/the-loai/vien-tuong", label: "Viễn Tưởng" },
  { href: "/the-loai/hoat-hinh", label: "Hoạt Hình" },
];

const navLinks = [
  { href: "/phim-moi", label: "Phim Mới" },
  { href: "/phim-le", label: "Phim Lẻ" },
  { href: "/phim-bo", label: "Phim Bộ" },
  { href: "/the-loai", label: "Thể Loại" },
  { href: "/search", label: "Tìm Kiếm" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/80 backdrop-blur-md mt-16">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-2xl font-black text-primary uppercase tracking-tighter">
              PhimPro
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Website xem phim trực tuyến miễn phí, cập nhật phim mới liên tục từ nhiều nguồn với
              chất lượng cao.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white/50">Điều Hướng</h4>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white/50">Thể Loại Hot</h4>
            <ul className="flex flex-col gap-2">
              {genreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 text-center text-sm text-neutral-600">
          © {new Date().getFullYear()} PhimPro. Chỉ dành cho mục đích học tập. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
