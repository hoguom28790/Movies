"use client";

import React from 'react';
import { useAniList } from "@/hooks/useAniList";
import { getAniListAuthUrl } from "@/lib/anilist";
import { useAuth } from "@/contexts/AuthContext";

export function StitchAniListSync() {
    const { status } = useAniList();
    const { user } = useAuth();

    const handleConnect = () => {
        if (!user) return;
        const authUrl = getAniListAuthUrl(user.uid);
        window.location.href = authUrl;
    };

    return (
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 theme-truyen">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3DB4F2] flex items-center justify-center shadow-lg shadow-[#3DB4F2]/20">
                        <span className="material-symbols-outlined text-white text-2xl">sync</span>
                    </div>
                    <div>
                        <h4 className="font-headline font-bold text-on-surface uppercase tracking-tight">AniList Scrobbling</h4>
                        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-60">Sycronize your progress</p>
                    </div>
                </div>
                {status === "connected" ? (
                    <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full font-label text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                        Connected
                    </span>
                ) : (
                    <button 
                        onClick={handleConnect}
                        className="px-6 py-2 bg-on-surface text-surface rounded-full font-label text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                        Connect
                    </button>
                )}
            </div>
            <p className="font-body text-xs text-on-surface-variant/70 leading-relaxed max-w-sm">
                Automatically update your AniList manga list as you read on Hồ Truyện. 
                Keep your bookmarks and chapters in sync across all devices.
            </p>
        </div>
    );
}
