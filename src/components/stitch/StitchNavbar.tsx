"use client";

import React from 'react';
import Link from 'next/link';
import { Search, History, Heart, Film } from 'lucide-react';
import { InstantSearch } from '../layout/InstantSearch';
import { ProfileDropdown } from '../layout/ProfileDropdown';
import { ThemeToggle } from '../theme-toggle';
import { NavMenu } from '../layout/NavMenu';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export function StitchNavbar() {
    const { user } = useAuth();
    const pathname = usePathname();

    return (
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-foreground/5 bg-background/80 transition-all duration-300">
            <div className="flex justify-between items-center px-6 md:px-8 h-14 max-w-[1920px] mx-auto">
                <div className="flex items-center gap-12">
                    <Link href="/truyen" className="text-xl md:text-2xl font-black tracking-tighter text-foreground font-headline uppercase group transition-transform hover:scale-105">
                        Hồ Truyện
                    </Link>
                    <div className="hidden md:block">
                        <NavMenu mode="truyen" />
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Link href="/" className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 mr-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground text-[11px] font-black uppercase tracking-widest transition-all border border-foreground/5">
                        <Film className="w-3.5 h-3.5" /> Sang Hồ Phim
                    </Link>

                    <div className="hidden lg:block w-48 xl:w-64 mr-2">
                        <InstantSearch />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/truyen/search"
                            className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-full transition-all"
                            title="Tìm kiếm"
                        >
                            <Search className="h-5 w-5" />
                        </Link>
                        
                        <Link
                            href="/truyen/lich-su"
                            className={`p-2 rounded-full transition-all ${
                                pathname === "/truyen/lich-su" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
                            }`}
                            title="Lịch sử"
                        >
                            <History className="h-5 w-5" />
                        </Link>

                        <ThemeToggle />

                        <Link
                            href="/truyen/yeu-thich"
                            className={`p-2 rounded-full transition-all ${
                                pathname === "/truyen/yeu-thich" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-foreground/10 hover:text-foreground"
                            }`}
                            title="Yêu thích"
                        >
                            <Heart className={`h-5 w-5 ${pathname === "/truyen/yeu-thich" ? "fill-current" : ""}`} />
                        </Link>

                        <div className="ml-1 pl-1 border-l border-foreground/10">
                            {user ? (
                                <ProfileDropdown />
                            ) : (
                                <button
                                    className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                >
                                    Đăng nhập
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
