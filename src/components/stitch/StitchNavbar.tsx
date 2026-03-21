"use client";

import React from 'react';
import Link from 'next/link';
import { Search, History, Heart } from 'lucide-react';
import { InstantSearch } from '../layout/InstantSearch';
import { ProfileDropdown } from '../layout/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export function StitchNavbar() {
    const { user } = useAuth();
    const pathname = usePathname();

    return (
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 bg-[#0a0a0a]/90 transition-all duration-300">
            <div className="flex justify-between items-center px-6 md:px-8 h-14 max-w-[1920px] mx-auto">
                <div className="flex items-center gap-12">
                    <Link href="/truyen" className="text-xl md:text-2xl font-black tracking-tighter text-white font-headline uppercase group transition-transform hover:scale-105">
                        Hồ Truyện
                    </Link>
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link href="/truyen" className="text-primary border-b-2 border-primary pb-1 font-headline tracking-wider uppercase text-[11px] font-black">
                            Trang chủ
                        </Link>
                        <Link href="/truyen" className="text-white/40 hover:text-white transition-all font-headline tracking-wider uppercase text-[11px] font-black">
                            Thể loại
                        </Link>
                        <Link href="/truyen?status=all" className="text-white/40 hover:text-white transition-all font-headline tracking-wider uppercase text-[11px] font-black">
                            Mới cập nhật
                        </Link>
                        <Link href="/truyen" className="text-white/40 hover:text-white transition-all font-headline tracking-wider uppercase text-[11px] font-black">
                            Bảng xếp hạng
                        </Link>
                    </nav>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="hidden lg:block w-48 xl:w-64 mr-2">
                        <InstantSearch />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/truyen/search"
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            title="Tìm kiếm"
                        >
                            <Search className="h-5 w-5" />
                        </Link>
                        
                        <Link
                            href="/truyen/lich-su"
                            className={`p-2 rounded-full transition-all ${
                                pathname === "/truyen/lich-su" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:bg-white/10 hover:text-white"
                            }`}
                            title="Lịch sử"
                        >
                            <History className="h-5 w-5" />
                        </Link>

                        <Link
                            href="/truyen/yeu-thich"
                            className={`p-2 rounded-full transition-all ${
                                pathname === "/truyen/yeu-thich" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:bg-white/10 hover:text-white"
                            }`}
                            title="Yêu thích"
                        >
                            <Heart className={`h-5 w-5 ${pathname === "/truyen/yeu-thich" ? "fill-current" : ""}`} />
                        </Link>

                        <div className="ml-1 pl-1 border-l border-white/5">
                            {user ? (
                                <ProfileDropdown />
                            ) : (
                                <button
                                    className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
