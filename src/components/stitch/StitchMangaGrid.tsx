import React from 'react';
import { StitchMangaCard } from './StitchMangaCard';

interface StitchMangaGridProps {
    title: string;
    featuredComic: any;
    secondaryComics: any[];
}

export function StitchMangaGrid({ title, featuredComic, secondaryComics }: StitchMangaGridProps) {
    return (
        <section className="px-6 md:px-24 py-24 bg-background theme-truyen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-16">
                    <div className="flex flex-col gap-2">
                        <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-xs opacity-60">
                            Cập nhật mới
                        </span>
                        <h2 className="font-headline font-black text-4xl md:text-6xl uppercase tracking-tighter leading-[0.8] text-on-surface">
                            {title}
                        </h2>
                    </div>
                    <button className="font-label text-xs uppercase tracking-widest font-bold border-b border-primary text-primary pb-1 hover:opacity-70 transition-all">
                        Tất cả truyện
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                    {/* Featured Manga Spans 8 Columns */}
                    <div className="md:col-span-8 flex flex-col h-full">
                        <StitchMangaCard 
                            {...featuredComic} 
                            variant="horizontal" 
                        />
                    </div>
                    
                    {/* Secondary Manga Spans 4 Columns */}
                    <div className="md:col-span-4 flex flex-col gap-8 md:gap-12">
                        {secondaryComics.map((comic, idx) => (
                            <div key={idx} className="flex-1">
                                <StitchMangaCard 
                                    {...comic} 
                                    variant="vertical" 
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Optional Bottom Accent */}
                <div className="mt-24 h-[1px] w-full bg-outline-variant opacity-20 hidden md:block"></div>
                <div className="mt-2 text-right hidden md:block">
                    <span className="font-headline font-black text-6xl opacity-5 select-none tracking-tighter uppercase">NOIR GRID SYSTEM</span>
                </div>
            </div>
        </section>
    );
}
