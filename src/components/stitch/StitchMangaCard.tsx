import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface StitchMangaCardProps {
    title: string;
    slug: string;
    imageUrl: string;
    latestChapter?: string;
    tags?: string[];
    isHot?: boolean;
    variant?: 'featured' | 'secondary' | 'gallery';
    className?: string;
}

export function StitchMangaCard({ 
    title, 
    slug, 
    imageUrl, 
    latestChapter, 
    tags = [], 
    isHot = false, 
    variant = 'gallery',
    className = ""
}: StitchMangaCardProps) {
    if (variant === 'featured') {
        return (
            <div className={`md:col-span-8 group cursor-pointer ${className}`}>
                <Link href={`/truyen/${slug}`}>
                    <div className="relative aspect-[16/9] mb-4 md:mb-6 overflow-hidden bg-surface-container-low">
                        <Image 
                            src={imageUrl} 
                            alt={title} 
                            fill 
                            className="object-cover transition-transform duration-700 md:group-hover:scale-105"
                            unoptimized
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                             {latestChapter && <span className="px-2 py-1 bg-on-tertiary-fixed text-white text-[9px] font-bold uppercase tracking-widest">{latestChapter}</span>}
                             {isHot && <span className="px-2 py-1 bg-primary text-white text-[9px] font-bold uppercase tracking-widest">Hot</span>}
                        </div>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-xl md:text-2xl font-bold font-headline text-on-surface uppercase tracking-tight md:group-hover:text-primary transition-colors">{title}</h4>
                            <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mt-1">{tags.join(' • ')}</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">bolt</span>
                    </div>
                </Link>
            </div>
        );
    }

    if (variant === 'secondary') {
        return (
            <div className={`group cursor-pointer ${className}`}>
                <Link href={`/truyen/${slug}`}>
                    <div className="relative aspect-[4/3] mb-4 bg-surface-container-low overflow-hidden">
                        <Image 
                            src={imageUrl} 
                            alt={title} 
                            fill 
                            className="object-cover transition-transform duration-700 md:group-hover:scale-105"
                            unoptimized
                        />
                    </div>
                    <h4 className="text-lg font-bold font-headline text-on-surface uppercase tracking-tight md:group-hover:text-primary transition-colors">{title}</h4>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest mt-1">{tags.join(' • ')}</p>
                </Link>
            </div>
        );
    }

    // Default: Gallery
    return (
        <div className={`group flex-shrink-0 w-[200px] md:w-auto ${className}`}>
            <Link href={`/truyen/${slug}`}>
                <div className="relative aspect-[2/3] mb-4 md:mb-6 overflow-hidden bg-white editorial-shadow transition-transform duration-500 md:group-hover:-translate-y-2">
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover grayscale md:group-hover:grayscale-0 transition-all duration-700"
                        unoptimized
                    />
                    <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 bg-primary/90 text-white">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Đọc Ngay</p>
                    </div>
                </div>
                <h5 className="font-bold text-on-surface font-headline uppercase text-sm tracking-tight mb-1">{title}</h5>
                <p className="text-[9px] md:text-[10px] text-on-surface-variant uppercase tracking-widest">{tags[0] || 'Manga'}</p>
            </Link>
        </div>
    );
}
