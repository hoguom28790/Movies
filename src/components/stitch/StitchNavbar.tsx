import React from 'react';
import Link from 'next/link';

export function StitchNavbar() {
    return (
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-outline-variant/10 bg-white/80 dark:bg-[#131c27]/80">
            <div className="flex justify-between items-center px-6 md:px-8 py-4 md:py-6 max-w-[1920px] mx-auto">
                <div className="flex items-center gap-12">
                    <Link href="/truyen" className="text-xl md:text-2xl font-black tracking-tighter text-[#131c27] dark:text-slate-50 font-headline uppercase">
                        Hồ Truyện
                    </Link>
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link href="/truyen" className="text-[#b02c2f] dark:text-[#d24545] border-b-2 border-[#b02c2f] pb-1 font-headline tracking-wider uppercase text-sm font-bold">
                            Trang chủ
                        </Link>
                        <Link href="/truyen" className="text-slate-600 dark:text-slate-400 hover:text-[#b02c2f] transition-opacity duration-300 font-headline tracking-wider uppercase text-sm font-bold">
                            Thể loại
                        </Link>
                        <Link href="/truyen?status=all" className="text-slate-600 dark:text-slate-400 hover:text-[#b02c2f] transition-opacity duration-300 font-headline tracking-wider uppercase text-sm font-bold">
                            Mới cập nhật
                        </Link>
                        <Link href="/truyen" className="text-slate-600 dark:text-slate-400 hover:text-[#b02c2f] transition-opacity duration-300 font-headline tracking-wider uppercase text-sm font-bold">
                            Bảng xếp hạng
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <button className="material-symbols-outlined text-on-surface hover:text-primary transition-opacity duration-300 active:scale-95">search</button>
                    <Link href="/truyen/lich-su" className="hidden md:block material-symbols-outlined text-on-surface hover:text-primary transition-opacity duration-300 active:scale-95">history</Link>
                    <Link href="/truyen/yeu-thich" className="hidden md:block material-symbols-outlined text-on-surface hover:text-primary transition-opacity duration-300 active:scale-95">bookmark</Link>
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden cursor-pointer hover:opacity-70 transition-opacity active:scale-95">
                        <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN5e1DSnypqFOjzlkqnsEOfVDOy8KZKuHsfcKO9RuyAQXJbu_3Y6i-imIFPH-kokmzeAMVtVk1QZI3THzcDVyAbRdMB6cIcFThlpfpWQvVv6hjuWW1oH1ENBJV-amjR5RZD33Cq0EwdCVA5PBsWv7_q1zToRjkx3d4l4EiwyhgIVsXF77NCfhFTT7xKr5qMtEI5sWOTSgsT_B0LSyHsPrt0o6Wk5gSCG8KxnYbNEgdyclyLzKkq6J-GjuhVSlYU4OvLt1wV013u5UV"/>
                    </div>
                </div>
            </div>
        </header>
    );
}
