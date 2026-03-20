"use client";

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
              Hồ Phim
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Trang web xem phim trực tuyến chất lượng cao, cập nhật liên tục với nhiều tính năng thông minh.
            </p>
          </div>
          
          {/* Navigation & Genres can stay as is or be updated */}
          {/* ... */}
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Hồ Phim. Chỉ dành cho mục đích học tập.
          </div>
          <button 
            onClick={() => {
              const modal = document.getElementById('instruction-modal');
              if (modal) modal.style.display = 'flex';
            }}
            className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors bg-primary/10 px-5 py-2.5 rounded-full border border-primary/20"
          >
            Hướng dẫn & Tính năng
          </button>
        </div>
      </div>

      {/* Instruction Modal */}
      <div 
        id="instruction-modal" 
        className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
          }
        }}
      >
        <div className="bg-surface border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-8 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white">Hướng dẫn & Tính năng</h2>
            <button 
              onClick={() => document.getElementById('instruction-modal')!.style.display = 'none'}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-primary font-bold uppercase tracking-wider text-sm">Tính năng Player</h3>
              <ul className="space-y-3 text-sm text-neutral-300">
                <li className="flex gap-2"><span>✨</span><b>Vuốt Trái:</b> Chỉnh độ sáng (Mobile)</li>
                <li className="flex gap-2"><span>✨</span><b>Vuốt Phải:</b> Chỉnh âm lượng (Mobile)</li>
                <li className="flex gap-2"><span>✨</span><b>Nhấn giữ:</b> Tăng tốc độ 2.0x</li>
                <li className="flex gap-2"><span>✨</span><b>Chạm 2 lần:</b> Tua nhanh/lùi 10s</li>
                <li className="flex gap-2"><span>✨</span><b>Tự động:</b> Xoay ngang khi phóng to</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-primary font-bold uppercase tracking-wider text-sm">Đồng bộ & Lưu trữ</h3>
              <ul className="space-y-3 text-sm text-neutral-300">
                <li className="flex gap-2"><span>🔗</span><b>Trakt.tv:</b> Đồng bộ lịch sử xem</li>
                <li className="flex gap-2"><span>📍</span><b>Ghi nhớ:</b> Tiếp tục xem từ phút cuối</li>
                <li className="flex gap-2"><span>📁</span><b>Thư viện:</b> Lưu phim vào danh sách riêng</li>
                <li className="flex gap-2"><span>🌟</span><b>Diễn viên:</b> Theo dõi nghệ sĩ yêu thích</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs text-neutral-400 leading-relaxed italic">
            * Hệ thống đang tích hợp dữ liệu từ TMDB để cung cấp thông tin hình ảnh, diễn viên và đánh giá chất lượng cao nhất.
          </div>
        </div>
      </div>
    </footer>
  );
}
