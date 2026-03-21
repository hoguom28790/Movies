"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Heart, Search, History as HistoryIcon, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
 
const GENRES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Viễn Tưởng", slug: "vien-tuong" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Hài Hước", slug: "hai-huoc" },
  { name: "Hoạt Hình", slug: "hoat-hinh" },
  { name: "Cổ Trang", slug: "co-trang" },
  { name: "Phim 18+", slug: "phim-18" },
  { name: "TopXX 🎬", href: "/topxx" },
];
 
const COUNTRIES = [
  { name: "Hàn Quốc", slug: "han-quoc" },
  { name: "Trung Quốc", slug: "trung-quoc" },
  { name: "Âu Mỹ", slug: "au-my" },
  { name: "Nhật Bản", slug: "nhat-ban" },
  { name: "Việt Nam", slug: "viet-nam" },
  { name: "Thái Lan", slug: "thai-lan" },
];
 
const COMIC_GENRES = [
  { name: "Hành Động", slug: "action" },
  { name: "Chuyển Sinh", slug: "chuyen-sinh" },
  { name: "Comedy", slug: "comedy" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Horror", slug: "horror" },
  { name: "Isekai", slug: "isekai" },
  { name: "Manhwa", slug: "manhwa" },
  { name: "Romance", slug: "romance" },
  { name: "Slice of life", slug: "slice-of-life" },
];

const COMIC_STATUSES = [
  { name: "Tất cả", slug: "all" },
  { name: "Đang ra", slug: "dang-phat-hanh" },
  { name: "Hoàn thành", slug: "hoan-thanh" },
];

const DIRECT_LINKS = [
  { label: "Truyện Tranh", href: "/truyen" },
  { label: "Phim Lẻ", href: "/phim-le" },
  { label: "Phim Bộ", href: "/phim-bo" },
  { label: "Hoạt Hình", href: "/hoat-hinh" },
  { label: "TV Shows", href: "/tv-shows" },
];
 
interface MobileMenuProps {
  mode?: "phim" | "truyen";
}

export function MobileMenu({ mode }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();
  const isComicSection = mode === "truyen" || pathname.startsWith("/truyen") || pathname.startsWith("/doc");
  const { user } = useAuth();
 
  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
 
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const currentLinks = isComicSection ? [
    { label: "Về Hồ Phim", href: "/" }
  ] : [
    { label: "Đọc Truyện", href: "/truyen" },
    ...DIRECT_LINKS.filter(l => l.href !== "/truyen")
  ];
 
  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Open Menu"
      >
        <Menu className="h-6 w-6" />
      </button>
 
      {/* Overlay Drawer */}
      <div 
        className={`fixed inset-0 z-[1000] bg-black transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.06]">
          <span className={`text-xl font-bold ${isComicSection ? 'text-indigo-500' : 'text-primary'}`}>Hồ {isComicSection ? 'Truyện' : 'Phim'}</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/60"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
 
        {/* Scrollable Content */}
        <div className="h-[calc(100vh-56px)] overflow-y-auto px-4 py-6 space-y-6">
          {/* Quick Search */}
          <Link 
            href="/search"
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-white/5 text-white/60 border border-white/[0.06]"
          >
            <Search className="h-5 w-5" />
            <span className="text-[14px]">Tìm kiếm phim...</span>
          </Link>
          
          {/* Main Links */}
          <div className="grid grid-cols-2 gap-3">
            {currentLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href}
                className="flex items-center justify-center p-4 rounded-xl bg-white/5 border border-white/[0.06] text-[13px] font-semibold text-white/80 hover:bg-primary/20 hover:border-primary/30 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
 
          {!isComicSection && (
            <div className="space-y-2">
              {/* Genres */}
              <div>
                <button 
                  onClick={() => setOpenSection(openSection === "genres" ? null : "genres")}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.02] text-white/80 text-[14px] font-semibold"
                >
                  Thể loại
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "genres" ? "rotate-180" : ""}`} />
                </button>
                {openSection === "genres" && (
                  <div className="grid grid-cols-2 gap-2 p-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {GENRES.map(g => (
                      <Link 
                        key={g.slug || g.href} 
                        href={g.href || `/the-loai/${g.slug}`}
                        onClick={(e) => {
                          if (g.slug === "phim-18") {
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
                        }}
                        className="p-3 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {g.name}
                      </Link>
                    ))}
                    <Link href="/the-loai/tat-ca" className="p-3 text-[13px] text-primary font-medium hover:bg-white/5 rounded-lg transition-colors col-span-2 text-center border-t border-white/[0.03]">
                      Xem tất cả thể loại
                    </Link>
                  </div>
                )}
              </div>
  
              {/* Countries */}
              <div>
                <button 
                  onClick={() => setOpenSection(openSection === "countries" ? null : "countries")}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.02] text-white/80 text-[14px] font-semibold"
                >
                  Quốc gia
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "countries" ? "rotate-180" : ""}`} />
                </button>
                {openSection === "countries" && (
                  <div className="grid grid-cols-2 gap-2 p-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {COUNTRIES.map(c => (
                      <Link 
                        key={c.slug} 
                        href={`/quoc-gia/${c.slug}`}
                        className="p-3 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isComicSection && (
            <div className="space-y-2">
              {/* Comic Genres */}
              <div>
                <button 
                  onClick={() => setOpenSection(openSection === "comic_genres" ? null : "comic_genres")}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.02] text-white/80 text-[14px] font-semibold"
                >
                  Thể loại Truyện
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "comic_genres" ? "rotate-180" : ""}`} />
                </button>
                {openSection === "comic_genres" && (
                  <div className="grid grid-cols-2 gap-2 p-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {COMIC_GENRES.map(g => (
                      <Link 
                        key={g.slug} 
                        href={`/truyen?genre=${g.slug}`}
                        className="p-3 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
  
              {/* Comic Status */}
              <div>
                <button 
                  onClick={() => setOpenSection(openSection === "comic_status" ? null : "comic_status")}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.02] text-white/80 text-[14px] font-semibold"
                >
                  Trạng thái
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "comic_status" ? "rotate-180" : ""}`} />
                </button>
                {openSection === "comic_status" && (
                  <div className="grid grid-cols-2 gap-2 p-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {COMIC_STATUSES.map(c => (
                      <Link 
                        key={c.slug} 
                        href={`/truyen?status=${c.slug}`}
                        className="p-3 text-[13px] text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {/* Footer Info */}
          <div className="pt-8 pb-12 border-t border-white/[0.06] space-y-3">
            <Link 
              href={isComicSection ? "/truyen/yeu-thich" : "/watchlist"}
              className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary"
            >
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-bold text-[14px]">Danh sách yêu thích</span>
            </Link>
            <Link 
              href={isComicSection ? "/truyen/lich-su" : "/history"}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/[0.06] text-white/80"
            >
              <HistoryIcon className="h-5 w-5" />
              <span className="font-bold text-[14px]">Lịch sử {isComicSection ? 'đọc truyện' : 'xem phim'}</span>
            </Link>
            {user && !isComicSection && (
              <Link 
                href="/settings"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/[0.06] text-white/80"
              >
                <Settings className="h-5 w-5" />
                <span className="font-bold text-[14px]">Cài đặt đồng bộ Trakt.tv</span>
              </Link>
            )}
            <p className="text-[12px] text-white/20 text-center mt-8">
              &copy; 2026 Hồ {isComicSection ? 'Truyện' : 'Phim'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
