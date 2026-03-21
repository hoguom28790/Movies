import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface StitchHeroProps {
    title: string;
    description: string;
    imageUrl: string;
    slug: string;
    featuredTag?: string;
}

export function StitchHero({ title, description, imageUrl, slug, featuredTag = "Featured Archive" }: StitchHeroProps) {
    return (
        <section className="relative h-[600px] md:h-[870px] w-full overflow-hidden flex items-end">
            <div className="absolute inset-0 z-0">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover"
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
            </div>
            <div className="relative z-10 p-6 md:p-12 lg:p-24 w-full max-w-[1440px] mx-auto">
                <span className="inline-block mb-3 md:mb-4 px-3 py-1 bg-primary text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-label">
                    {featuredTag}
                </span>
                <h2 className="text-5xl md:text-8xl font-black font-headline text-on-surface uppercase tracking-tighter leading-none mb-4 md:mb-6 whitespace-pre-line">
                    {title}
                </h2>
                <p className="text-base md:text-xl text-on-surface-variant max-w-sm md:max-w-xl mb-6 md:mb-8 leading-relaxed font-light font-body">
                    {description}
                </p>
                <div className="flex gap-4 md:gap-6 items-center">
                    <Link 
                        href={`/truyen/${slug}`}
                        className="px-8 md:px-10 py-3 md:py-4 crimson-pulse text-white font-bold uppercase text-xs md:text-sm tracking-widest rounded-full editorial-shadow hover:scale-105 transition-transform active:scale-95"
                    >
                        Đọc Ngay
                    </Link>
                    <Link 
                        href={`/truyen/${slug}`}
                        className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1 font-label"
                    >
                        Chi tiết
                    </Link>
                </div>
            </div>
        </section>
    );
}
