"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RotateCw } from 'lucide-react';

export interface StitchMangaCardProps {
    title: string;
    description?: string;
    imageUrl: string;
    slug: string;
    lastChapter?: string;
    category?: string;
    variant?: 'vertical' | 'horizontal' | 'list';
    isSynced?: boolean;
    posterColor?: string;
    priority?: boolean;
}

export function StitchMangaCard({ 
    title, 
    description, 
    imageUrl, 
    slug, 
    lastChapter, 
    category = "Truyện mới", 
    variant = 'vertical',
    isSynced = false,
    posterColor = '#ffffff',
    priority = false
}: StitchMangaCardProps) {
    
    if (variant === 'list') {
        return (
            <Link 
                href={`/truyen/${slug}`}
                className="group flex gap-4 p-4 bg-surface border border-outline-variant transition-all hover:bg-surface-bright theme-truyen"
            >
                <div className="relative w-16 h-24 flex-shrink-0 overflow-hidden">
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                    />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-headline font-bold text-base truncate mb-1">
                        {title}
                    </h3>
                    <p className="font-label text-primary text-[10px] uppercase font-bold">
                        {lastChapter || "Mới nhất"}
                    </p>
                </div>
            </Link>
        );
    }
    
    if (variant === 'horizontal') {
        return (
            <Link 
                href={`/truyen/${slug}`}
                className="group relative flex flex-col bg-surface border border-outline-variant overflow-hidden p-6 editorial-shadow transition-all duration-700 hover:scale-[1.01] theme-truyen"
                style={posterColor ? { boxShadow: `0 0 60px -20px ${posterColor}30` } : {}}
            >
                <div className="relative aspect-[4/3] w-full mb-6 overflow-hidden rounded-xl">
                     {/* Backdrop Glow */}
                     <div 
                        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-1000"
                        style={{ backgroundColor: posterColor }}
                    />
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover relative z-10 transition-transform duration-1000 group-hover:scale-110"
                        unoptimized
                        priority={priority}
                    />
                    
                    {isSynced && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="bg-primary-container p-2 rounded-full shadow-lg">
                                <RotateCw className="w-4 h-4 text-on-primary-container animate-pulse" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="font-label text-primary uppercase tracking-widest text-[9px] font-bold">
                            {category}
                        </span>
                        <div className="h-[1px] flex-grow bg-outline-variant opacity-30"></div>
                    </div>
                    <h3 className="font-headline font-black text-2xl md:text-3xl leading-[0.9] uppercase tracking-tighter truncate md:whitespace-normal group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="font-body text-on-surface-variant text-xs line-clamp-2 opacity-60">
                        {description || "Khám phá câu chuyện hấp dẫn trong tác phẩm này."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                         <span className="font-headline font-black text-4xl opacity-5">#01</span>
                         <span className="font-label text-xs uppercase tracking-[0.3em] font-bold group-hover:text-primary transition-colors">
                            BẮT ĐẦU ĐỌC
                         </span>
                    </div>
                </div>
            </Link>
        );
    }

    // Default Vertical Card (Noir Grid Item)
    return (
        <Link 
            href={`/truyen/${slug}`}
            className="group relative flex flex-col bg-surface-container overflow-hidden border border-outline-variant transition-all hover:scale-[1.02] theme-truyen editorial-shadow rounded-2xl"
            style={posterColor ? { boxShadow: `0 0 50px -15px ${posterColor}20` } : {}}
        >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    unoptimized
                    priority={priority}
                />
                
                {isSynced && (
                    <div className="absolute top-3 left-3 z-20">
                        <div className="bg-primary-container p-1.5 rounded-full shadow-lg backdrop-blur-md border border-on-primary-container/20">
                            <RotateCw className="w-3.5 h-3.5 text-on-primary-container" />
                        </div>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 {/* Badge */}
                 {lastChapter && (
                    <div className="absolute bottom-4 right-4 bg-primary px-3 py-1 font-headline font-bold text-[10px] text-white tracking-widest uppercase">
                        {lastChapter}
                    </div>
                )}
            </div>
            
            <div className="p-5 flex flex-col gap-1 bg-surface">
                <span className="font-label text-primary uppercase tracking-widest text-[9px] font-bold opacity-60 group-hover:opacity-100 transition-all">
                    {category}
                </span>
                <h3 className="font-headline font-black text-xl leading-[0.9] uppercase tracking-tighter truncate group-hover:text-primary transition-all">
                    {title}
                </h3>
            </div>
        </Link>
    );
}
