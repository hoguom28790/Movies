"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface StitchHeroProps {
    title: string;
    description: string;
    imageUrl: string;
    slug: string;
    category?: string;
}

export function StitchHero({ title, description, imageUrl, slug, category = "Phát hành mới" }: StitchHeroProps) {
    // Split title for effect if possible, or just use it
    const words = title.split(' ');
    const firstWord = words[0];
    const rest = words.slice(1).join(' ');

    return (
        <section className="relative h-[80vh] md:h-[921px] w-full overflow-hidden flex items-center theme-truyen">
            <div className="absolute inset-0 z-0">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover grayscale opacity-60 md:opacity-100 transition-opacity duration-1000"
                    unoptimized
                />
                <div className="absolute inset-0 hero-gradient"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            </div>
            
            <div className="relative z-10 px-6 md:px-24 w-full max-w-7xl mt-24">
                <div className="flex flex-col gap-6">
                    <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-[10px] md:text-xs">
                        {category}
                    </span>
                    <h1 className="font-headline text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
                        {firstWord}<br/>
                        <span className="text-stroke-red">{rest || "Manga"}</span>
                    </h1>
                    
                    <div className="max-w-md">
                        <p className="font-body text-on-surface-variant text-sm md:text-base leading-relaxed mb-10 opacity-80">
                            {description}
                        </p>
                        
                        <div className="flex gap-4">
                            <Link 
                                href={`/truyen/${slug}`}
                                className="bg-primary-container text-on-primary-container px-8 md:px-12 py-4 font-headline font-bold uppercase tracking-widest text-xs md:text-sm hover:brightness-110 transition-all editorial-shadow"
                            >
                                Đọc Ngay
                            </Link>
                            <Link 
                                href={`/truyen/${slug}`}
                                className="bg-surface-container-highest/20 backdrop-blur-md text-on-surface px-8 md:px-12 py-4 font-headline font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-surface-bright/30 transition-all border border-white/5"
                            >
                                Chi Tiết
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Label for Desktop */}
            <div className="absolute bottom-12 right-24 hidden xl:block">
                <div className="flex items-center gap-4 rotate-90 origin-right">
                    <span className="font-headline font-black text-on-surface text-8xl uppercase tracking-tighter opacity-10">NOIR EDITION</span>
                </div>
            </div>
        </section>
    );
}
