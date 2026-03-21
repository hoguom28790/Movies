"use client";

import React from 'react';
import { useAniList } from "@/hooks/useAniList";
import { SyncIcon } from "@/components/icons/SyncIcon";

export function StitchAniListSync() {
    const { isConnected, login } = useAniList();

    if (isConnected) {
        return (
            <div className="w-full bg-surface-container border border-outline-variant p-12 flex flex-col md:flex-row items-center justify-between gap-10 editorial-shadow group overflow-hidden relative theme-truyen">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                <div className="flex flex-col gap-4 text-center md:text-left z-10">
                    <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-xs opacity-60">Status: Account Linked</span>
                    <h2 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter leading-none text-on-surface">Đã Kết Nối AniList</h2>
                    <p className="font-body text-on-surface-variant max-w-lg opacity-70">
                        Tiến trình đọc của bạn đang được đồng bộ hóa tự động. Mỗi chương truyện bạn đọc sẽ được cập nhật trực tiếp lên hồ sơ AniList của mình.
                    </p>
                </div>
                
                <div className="flex items-center gap-6 z-10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                        <SyncIcon className="w-8 h-8 animate-spin-slow" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-background border border-outline-variant p-12 flex flex-col items-center text-center gap-8 editorial-shadow group overflow-hidden relative theme-truyen">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="flex flex-col gap-4 z-10">
                <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-xs opacity-60">Sync Your Library</span>
                <h2 className="font-headline font-black text-5xl md:text-8xl uppercase tracking-tighter leading-none text-on-surface">Đồng Bộ AniList</h2>
                <p className="font-body text-on-surface-variant max-w-2xl mx-auto opacity-70 text-lg">
                    Kết nối tài khoản AniList để lưu lại mọi chương truyện đã đọc. Đừng bao giờ đánh mất tiến trình của bạn nữa.
                </p>
            </div>
            
            <button 
                onClick={login}
                className="z-10 bg-primary-container px-12 py-5 font-headline font-bold text-on-primary-container uppercase tracking-[0.4em] text-sm hover:brightness-110 hover:scale-105 transition-all editorial-shadow flex items-center gap-4 group/btn"
            >
                <SyncIcon className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-700" />
                Liên Kết Ngay
            </button>
            
            {/* Small Footer in Card */}
            <div className="z-10 font-label text-[10px] uppercase font-bold tracking-widest opacity-30 mt-4">
                Powered by AniList GraphQL API v2
            </div>
        </div>
    );
}
