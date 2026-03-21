import React from 'react';
import Link from 'next/link';

export function StitchBottomBar() {
    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-3xl bg-white/90 dark:bg-[#131c27]/90 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex justify-around items-center pt-3 pb-safe px-6 md:hidden theme-truyen">
            <Link className="flex flex-col items-center justify-center text-[#b02c2f] dark:text-[#d24545] scale-110" href="/truyen">
                <span className="material-symbols-outlined">home</span>
                <span className="font-inter text-[10px] font-medium uppercase tracking-widest">Trang chủ</span>
            </Link>
            <Link className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#b02c2f] transition-colors" href="/truyen">
                <span className="material-symbols-outlined">category</span>
                <span className="font-inter text-[10px] font-medium uppercase tracking-widest">Thể loại</span>
            </Link>
            <Link className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#b02c2f] transition-colors" href="/truyen">
                <span className="material-symbols-outlined">new_releases</span>
                <span className="font-inter text-[10px] font-medium uppercase tracking-widest">Cập nhật</span>
            </Link>
            <Link className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#b02c2f] transition-colors" href="/truyen">
                <span className="material-symbols-outlined">leaderboard</span>
                <span className="font-inter text-[10px] font-medium uppercase tracking-widest">Xếp hạng</span>
            </Link>
        </nav>
    );
}
