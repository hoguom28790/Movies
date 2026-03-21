import React from 'react';
import { StitchMangaCard, StitchMangaCardProps } from './StitchMangaCard';

interface StitchMangaGridProps {
    title: string;
    featuredComic: StitchMangaCardProps;
    secondaryComics: StitchMangaCardProps[];
}

export function StitchMangaGrid({ title, featuredComic, secondaryComics }: StitchMangaGridProps) {
    return (
        <section className="px-6 lg:px-24 py-16 md:py-24 bg-surface max-w-[1440px] mx-auto theme-truyen">
            <div className="flex flex-row justify-between items-baseline mb-8 md:mb-16">
                <h3 className="text-2xl md:text-4xl font-black font-headline text-on-surface uppercase tracking-tighter">{title}</h3>
                <p className="text-[10px] md:text-sm font-headline tracking-widest text-primary uppercase cursor-pointer hover:opacity-70 transition-opacity">Xem tất cả</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                {/* Large Featured Card */}
                <StitchMangaCard {...featuredComic} variant="featured" />
                
                {/* Secondary Cards */}
                <div className="md:col-span-4 flex flex-col gap-8 md:gap-12">
                    {secondaryComics.map((comic, idx) => (
                        <StitchMangaCard key={idx} {...comic} variant="secondary" />
                    ))}
                </div>
            </div>
        </section>
    );
}
