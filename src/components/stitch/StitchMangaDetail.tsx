"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ComicFavoriteBtn } from "@/components/comic/ComicFavoriteBtn";
import { ComicContinueBtn } from "@/components/comic/ComicContinueBtn";
import { ComicSourceSelector } from "@/components/comic/ComicSourceSelector";
import { ComicPlaylistBtn } from "@/components/comic/ComicPlaylistBtn";

interface Chapter {
    chapter_name: string;
    chapter_title: string;
    chapter_api_data?: string;
}

interface StitchMangaDetailProps {
    title: string;
    slug: string;
    posterUrl: string;
    author: string;
    status: string;
    rating: string;
    description: string;
    categories: { name: string, slug: string }[];
    chapters: Chapter[];
    activeSource: string;
    anilistChapterImages?: string[];
    posterColor?: string;
}

export function StitchMangaDetail({
    title,
    slug,
    posterUrl,
    author,
    status,
    rating,
    description,
    categories,
    chapters,
    activeSource,
    anilistChapterImages = [],
    posterColor = '#ffffff'
}: StitchMangaDetailProps) {
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const sortedChapters = [...chapters].sort((a, b) => {
        const numA = parseFloat(a.chapter_name) || 0;
        const numB = parseFloat(b.chapter_name) || 0;
        return sortOrder === 'newest' ? numB - numA : numA - numB;
    });

    return (
        <main className="pt-20 md:pt-32 pb-24 md:pb-20 max-w-7xl mx-auto px-4 md:px-6 theme-truyen">
            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-2 mb-8 md:mb-12 text-on-surface-variant opacity-60 font-label text-[10px] uppercase tracking-[0.2em]">
                <Link className="hover:text-primary transition-colors" href="/truyen">Home</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <Link className="hover:text-primary transition-colors" href="/truyen">Curated</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-on-surface">{title}</span>
            </nav>

            {/* Hero Section */}
            <section className="flex flex-col md:grid md:grid-cols-12 gap-8 md:gap-16 items-start mb-16 md:mb-24">
                {/* Left: Cover Image */}
                <div className="w-full md:col-span-5 lg:col-span-4 md:sticky md:top-32 group">
                    <div 
                        className="relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-3xl shadow-2xl transition-all duration-700 hover:scale-[1.02] border border-white/5"
                        style={posterColor ? { boxShadow: `0 0 80px -20px ${posterColor}40` } : {}}
                    >
                        {/* Glow Effect */}
                        <div 
                            className="absolute -inset-20 z-0 opacity-20 blur-[100px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"
                            style={{ backgroundColor: posterColor }}
                        />
                        
                        <Image 
                            src={posterUrl} 
                            alt={title} 
                            fill 
                            className="object-cover relative z-10"
                            priority
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden"></div>
                        
                        {/* Tags Overlay for Mobile */}
                        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 md:hidden">
                            {categories.slice(0, 2).map((cat, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-label text-[9px] uppercase tracking-widest rounded-full border border-white/20">
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* Tags for Desktop/iPad */}
                    <div className="hidden md:flex flex-wrap gap-3 mt-8">
                        {categories.map((cat, idx) => (
                            <Link key={idx} href={`/truyen?genre=${cat.slug}`} className="px-4 py-1.5 bg-surface-container-high text-on-secondary-container font-label text-[10px] uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-colors">
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right: Elegant Typography & Content */}
                <div className="w-full md:col-span-7 lg:col-span-8 px-2 md:px-0">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-8xl font-headline font-black tracking-tighter text-on-surface leading-[0.9] mb-8 md:mb-12 uppercase">
                            {title}
                        </h1>
                        
                        {/* Metadata Row */}
                        <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:gap-12 mb-8 md:mb-12 border-y md:border-t-0 md:border-b border-outline-variant/10 py-6 md:pt-0 md:pb-8">
                            <div>
                                <p className="font-label text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-50 mb-1">Author</p>
                                <p className="font-headline font-bold text-sm md:text-lg truncate">{author}</p>
                            </div>
                            <div>
                                <p className="font-label text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-50 mb-1">Status</p>
                                <p className="font-headline font-bold text-sm md:text-lg text-primary">{status}</p>
                            </div>
                            <div>
                                <p className="font-label text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-50 mb-1">Rating</p>
                                <div className="flex items-center gap-1">
                                    <span className="font-headline font-bold text-sm md:text-lg">{rating}</span>
                                    <span className="material-symbols-outlined text-primary text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="text-lg md:text-xl leading-relaxed text-on-tertiary-fixed-variant/80 font-light mb-10 md:mb-12 first-letter:text-5xl first-letter:font-headline first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-primary"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />

                        <ComicSourceSelector activeSource={activeSource} />

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6 mt-12 mb-2">
                            {chapters.length > 0 ? (
                                <div className="flex gap-3 items-center">
                                  <Link 
                                      href={`/doc/${slug}/${chapters[chapters.length - 1].chapter_name}?source=${activeSource}`}
                                      className="flex-1 sm:flex-none px-10 py-5 bg-gradient-to-r from-primary to-primary-hover text-white rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center"
                                  >
                                      Đọc Ngay
                                  </Link>
                                  <ComicContinueBtn slug={slug} activeSource={activeSource} />
                                </div>
                            ) : (
                                <button disabled className="flex-1 sm:flex-none px-10 py-5 bg-surface-container-low text-on-surface-variant/40 rounded-full font-label text-xs font-bold uppercase tracking-[0.2em] text-center">
                                    Đang cập nhật
                                </button>
                            )}
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <ComicFavoriteBtn slug={slug} title={title} posterUrl={posterUrl} />
                                <ComicPlaylistBtn comicSlug={slug} comicTitle={title} coverUrl={posterUrl} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Chapters Section */}
            <section className="mt-20 md:mt-32">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-surface uppercase">Curated Archive</h2>
                        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-60 mt-2">Latest Updates & Chapters</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => setSortOrder('newest')}
                            className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-label uppercase tracking-widest border-b-2 transition-all ${
                                sortOrder === 'newest' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant opacity-40 hover:opacity-100'
                            }`}
                        >
                            Newest
                        </button>
                        <button 
                            onClick={() => setSortOrder('oldest')}
                            className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-label uppercase tracking-widest border-b-2 transition-all ${
                                sortOrder === 'oldest' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant opacity-40 hover:opacity-100'
                            }`}
                        >
                            Oldest
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-outline-variant/20 rounded-2xl overflow-hidden border border-outline-variant/10">
                    {sortedChapters.map((chapter, idx) => (
                        <Link 
                            key={idx}
                            href={`/doc/${slug}/${chapter.chapter_name}?source=${activeSource}`}
                            className="group relative bg-surface hover:bg-surface-container-low active:bg-surface-container-highest transition-all duration-300 min-h-[160px] overflow-hidden"
                        >
                            {/* Chapter Thumbnail (Bg) */}
                            <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-60 transition-all duration-700 bg-black">
                                <Image 
                                    src={anilistChapterImages.length > 0 ? (anilistChapterImages[idx % anilistChapterImages.length]) : posterUrl} 
                                    alt={chapter.chapter_name}
                                    fill
                                    className="object-cover scale-150 group-hover:scale-110 transition-transform duration-[4000ms] blur-[1px] group-hover:blur-0"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                            </div>

                            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-headline font-black text-3xl md:text-4xl text-outline-variant/40 group-hover:text-primary transition-colors">
                                        {chapter.chapter_name.padStart(3, '0')}
                                    </span>
                                    <span className="font-label text-[9px] md:text-[10px] uppercase tracking-widest text-on-surface-variant opacity-40">Update</span>
                                </div>
                                <h3 className="font-headline font-bold text-lg md:text-xl text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                    {chapter.chapter_title || `Chương ${chapter.chapter_name}`}
                                </h3>
                                <p className="text-xs md:text-sm text-on-surface-variant/60 line-clamp-1">Đọc chương mới nhất...</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}
