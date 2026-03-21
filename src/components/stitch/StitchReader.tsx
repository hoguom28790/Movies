"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Settings, Info, List, Home, Share2 } from 'lucide-react';
import { useAniList } from "@/hooks/useAniList";

interface Media {
    id: string;
    title: string;
    imageUrl: string;
    chapters: string[];
    currentChapterIndex: number;
    slug: string;
}

export function StitchReader({ media }: { media: Media }) {
    const [progress, setProgress] = useState(0);
    const [showToolbar, setShowToolbar] = useState(true);
    const [scrolledPast90, setScrolledPast90] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrobble } = useAniList();
    const lastScrollTop = useRef(0);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const totalHeight = scrollHeight - clientHeight;
        const currentProgress = (scrollTop / totalHeight) * 100;
        setProgress(currentProgress);
        
        // Hide/Show Toolbar on Scroll
        if (scrollTop > lastScrollTop.current && scrollTop > 50) {
            setShowToolbar(false);
        } else {
            setShowToolbar(true);
        }
        lastScrollTop.current = scrollTop;

        // AniList Scrobbling (Hồ Truyện Logic)
        if (currentProgress > 90 && !scrolledPast90) {
            setScrolledPast90(true);
            const chapterMatch = media.chapters[media.currentChapterIndex]?.match(/\d+/);
            const chapterNum = chapterMatch ? parseInt(chapterMatch[0]) : (media.currentChapterIndex + 1);
            scrobble(media.slug, media.title, chapterNum);
        }
    };

    return (
        <div className="fixed inset-0 bg-background theme-truyen z-50 overflow-hidden flex flex-col">
            {/* Noir Reader Toolbar */}
            <header className={`fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant px-6 py-4 flex items-center justify-between transition-all duration-500 ${showToolbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="flex items-center gap-6">
                    <Link href={`/truyen/${media.slug}`} className="hover:text-primary transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="font-headline font-black text-xl md:text-2xl uppercase tracking-tighter leading-none">{media.title}</h1>
                        <span className="font-label text-primary uppercase text-[10px] tracking-[0.4em] font-bold">Chapter {media.currentChapterIndex + 1}</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <button className="font-label text-xs font-bold uppercase tracking-widest hover:text-primary transition-all">Thông tin</button>
                    <button className="font-label text-xs font-bold uppercase tracking-widest hover:text-primary transition-all">Định dạng</button>
                    <button className="font-label text-xs font-bold uppercase tracking-widest hover:text-primary transition-all">Tương tác</button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="bg-primary-container p-2 md:p-3 text-on-primary-container editorial-shadow hover:scale-110 transition-transform">
                        <Share2 size={20} />
                    </button>
                </div>
            </header>

            {/* Reading Content */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pt-24"
            >
                <div className="max-w-[1000px] mx-auto flex flex-col">
                    {media.chapters.map((img, idx) => (
                        <div key={idx} className="relative w-full min-h-[50vh] bg-surface-container-low animate-pulse overflow-hidden">
                            <Image 
                                src={img} 
                                alt={`Page ${idx + 1}`} 
                                width={1200} 
                                height={1800} 
                                className="w-full h-auto relative z-10 opacity-0 transition-opacity duration-700 hover:grayscale-0"
                                onLoadingComplete={(img) => img.classList.remove('opacity-0')}
                                unoptimized
                            />
                        </div>
                    ))}
                    
                    {/* Chapter End Noir Screen */}
                    <div className="h-screen w-full flex flex-col items-center justify-center p-12 bg-surface text-center gap-10">
                         <div className="h-[2px] w-24 bg-primary mx-auto"></div>
                         <h2 className="font-headline font-black text-5xl md:text-8xl uppercase tracking-tighter leading-none max-w-2xl mx-auto drop-cap">
                            Bạn Đã Hoàn Thành Chương Này
                         </h2>
                         <div className="flex flex-col md:flex-row gap-6">
                            <button className="crimson-pulse px-12 py-5 font-headline font-bold text-white uppercase tracking-widest editorial-shadow hover:scale-105 transition-all">
                                Chương Tiếp Theo
                            </button>
                            <Link href="/truyen" className="border border-outline px-12 py-5 font-headline font-bold text-on-surface uppercase tracking-widest hover:bg-surface-variant transition-all">
                                Quay Lại Thư Viện
                            </Link>
                         </div>
                    </div>
                </div>
            </div>

            {/* Noir Progress Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-1 bg-outline-variant/30 z-[60]">
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-out relative shadow-[0_0_15px_rgba(210,69,69,0.5)]"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-primary editorial-shadow hidden md:block"></div>
                </div>
            </div>

            {/* Minimal Mobile Controls */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface/90 backdrop-blur-xl border border-outline-variant px-6 py-3 shadow-2xl z-[70] transition-all duration-500 md:hidden ${showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
                <ChevronLeft className="opacity-40" />
                <span className="font-label font-bold text-xs uppercase tracking-widest px-4 border-l border-r border-outline-variant">
                    P. {Math.round(progress)}%
                </span>
                <ChevronRight className="text-primary" />
            </div>
        </div>
    );
}
