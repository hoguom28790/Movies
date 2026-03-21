"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAniList } from '@/hooks/useAniList';

interface StitchReaderProps {
    slug: string;
    title: string;
    chapter: string;
    images: string[];
    chaptersList: string[];
    onNextChapter?: () => void;
}

export function StitchReader({ slug, title, chapter, images, chaptersList }: StitchReaderProps) {
    const [progress, setProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const { scrobble } = useAniList();

    useEffect(() => {
        if (progress > 90) {
            scrobble(slug, title, chapter);
        }
    }, [progress, slug, title, chapter, scrobble]);
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const scrollProgress = (currentScroll / totalHeight) * 100;
            setProgress(scrollProgress);

            // Estimate current page
            const pageHeight = document.documentElement.scrollHeight / images.length;
            const page = Math.ceil(currentScroll / pageHeight) + 1;
            setCurrentPage(Math.min(page, images.length));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [images.length]);

    const nextChapIndex = chaptersList.indexOf(chapter) - 1; // Assuming list is descending
    const nextChap = nextChapIndex >= 0 ? chaptersList[nextChapIndex] : null;

    return (
        <div className="theme-truyen bg-[#0F1721] text-on-tertiary-container font-body overflow-x-hidden min-h-screen">
            {/* Optimized Mobile Top Bar */}
            <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 py-4 glass-nav border-b border-white/5 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <Link href={`/truyen/${slug}`} className="flex items-center group/home">
                        <span className="material-symbols-outlined text-surface-variant text-2xl">arrow_back_ios</span>
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-headline text-[11px] font-black tracking-[0.15em] uppercase text-white leading-tight">{title}</span>
                        <span className="text-[10px] font-medium text-surface-variant/70 tracking-wide truncate max-w-[180px]">Ch {chapter}</span>
                    </div>
                </div>
                <div className="flex items-center gap-5 text-white/70">
                    <button className="material-symbols-outlined hover:text-primary transition-colors">settings</button>
                    <button className="material-symbols-outlined hover:text-primary transition-colors">share</button>
                </div>
            </header>

            {/* Reader Canvas */}
            <main className="relative w-full flex flex-col items-center pt-16 pb-24 overflow-y-auto custom-scrollbar">
                <div className="w-full flex flex-col gap-0 max-w-4xl mx-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative w-full bg-[#0a0a0a]">
                            <img 
                                src={img} 
                                alt={`Page ${idx + 1}`} 
                                className="w-full h-auto block"
                                loading={idx < 3 ? "eager" : "lazy"}
                            />
                        </div>
                    ))}
                    
                    {/* Loading/Next Chap Placeholder if any... or just Footer action */}
                    <div className="w-full py-16 flex flex-col items-center justify-center bg-[#0F1721]">
                        <div className="w-16 h-[1px] bg-primary/20"></div>
                        <span className="my-6 font-headline text-[9px] tracking-[0.4em] uppercase text-surface-variant/30 font-bold">End of Chapter</span>
                        <div className="w-16 h-[1px] bg-primary/20"></div>
                    </div>
                </div>

                {/* Mobile Footer Action */}
                <div className="w-full px-6 py-16 flex flex-col items-center gap-8">
                    {nextChap ? (
                        <Link 
                            href={`/doc/${slug}/${nextChap}`}
                            className="w-full max-w-sm py-5 rounded-lg bg-primary text-white font-headline text-[13px] font-black tracking-[0.25em] uppercase shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all text-center"
                        >
                            Next Chapter
                        </Link>
                    ) : (
                        <span className="text-white/30 uppercase tracking-widest text-xs">No more chapters</span>
                    )}
                    <div className="flex items-center gap-4 text-surface-variant/30 text-[9px] uppercase tracking-[0.3em] font-bold">
                        <span>End of Chapter {chapter}</span>
                    </div>
                </div>
            </main>

            {/* Floating HUD */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex flex-col gap-4 pointer-events-none pb-safe">
                {/* Progress Indicator */}
                <div className="w-full px-4 pointer-events-auto max-w-7xl mx-auto">
                    <div className="glass-nav border border-white/5 rounded-xl p-5 shadow-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-primary tracking-[0.1em] uppercase">Reading Progress</span>
                            <span className="text-[10px] font-bold text-white/90 tracking-wider">PAGE {currentPage} / {images.length}</span>
                        </div>
                        <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(210,69,69,0.5)]" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="w-full glass-nav flex justify-around items-center pt-4 pb-6 px-6 border-t border-white/5 pointer-events-auto shadow-[0_-8px_32px_rgba(0,0,0,0.3)] md:hidden">
                    <Link href="/truyen" className="flex flex-col items-center justify-center text-surface-variant/50 hover:text-primary transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[26px]">home</span>
                        <span className="font-body text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5">Trang chủ</span>
                    </Link>
                    <Link href="/truyen" className="flex flex-col items-center justify-center text-surface-variant/50 hover:text-primary transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[26px]">category</span>
                        <span className="font-body text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5">Thể loại</span>
                    </Link>
                    <div className="flex flex-col items-center justify-center text-primary cursor-pointer group">
                        <span className="material-symbols-outlined text-[28px] fill-[1]">auto_stories</span>
                        <span className="font-body text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5">Đang đọc</span>
                    </div>
                    <Link href="/truyen" className="flex flex-col items-center justify-center text-surface-variant/50 hover:text-primary transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[26px]">leaderboard</span>
                        <span className="font-body text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5">Xếp hạng</span>
                    </Link>
                </div>
            </nav>

            {/* Subtle Vignette for Focus */}
            <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.6)] z-10"></div>
            
            <style jsx>{`
                .glass-nav {
                    background: rgba(15, 23, 33, 0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                }
            `}</style>
        </div>
    );
}
