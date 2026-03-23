"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RotateCw, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
    index?: number;
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
    posterColor = '#ef4444',
    priority = false,
    index = 0
}: StitchMangaCardProps) {
    
    const cardVariants = {
        initial: { opacity: 0, y: 30, filter: "blur(10px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    };

    if (variant === 'list') {
        return (
            <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
            >
                <Link 
                    href={`/truyen/${slug}`}
                    className="group flex gap-6 p-5 bg-[#0a0a0b] rounded-[32px] border border-white/5 transition-all hover:bg-white/5 active-depth hover:border-[#ef4444]/20"
                >
                    <div className="relative w-20 h-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/5 shadow-cinematic-lg">
                        <Image 
                            src={imageUrl} 
                            alt={title} 
                            fill 
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            unoptimized
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-grow space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ef4444] italic opacity-60 group-hover:opacity-100 transition-opacity">
                            {category}
                        </span>
                        <h3 className="text-lg font-black text-white italic truncate uppercase tracking-tight font-headline group-hover:text-[#ef4444] transition-colors leading-tight">
                            {title}
                        </h3>
                        <p className="font-black text-white/30 text-[11px] uppercase tracking-widest italic flex items-center gap-2">
                           <Sparkles className="w-3 h-3 text-[#ef4444]" /> {lastChapter || "SYNCED ARCHIVE"}
                        </p>
                    </div>
                    <div className="self-center p-3 rounded-full bg-white/5 group-hover:bg-[#ef4444] group-hover:text-white transition-all">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                </Link>
            </motion.div>
        );
    }
    
    if (variant === 'horizontal') {
        return (
            <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 1, delay: Math.min(index * 0.1, 0.5), ease: [0.16, 1, 0.3, 1] }}
            >
                <Link 
                    href={`/truyen/${slug}`}
                    className="group relative flex flex-col bg-[#0a0a0b] border border-white/5 overflow-hidden p-8 rounded-[48px] shadow-cinematic-2xl transition-all duration-1000 hover:border-[#ef4444]/20 active-depth perspective-1000"
                    style={{ boxShadow: `0 0 60px -20px ${posterColor}30` }}
                >
                    <div className="relative aspect-[16/10] w-full mb-8 overflow-hidden rounded-[32px] border border-white/5 shadow-cinematic-lg">
                        <Image 
                            src={imageUrl} 
                            alt={title} 
                            fill 
                            className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
                            unoptimized
                            priority={priority}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        
                        {isSynced && (
                            <div className="absolute top-6 left-6 z-20">
                                <div className="glass-pro p-3 rounded-[20px] shadow-cinematic-xl border border-white/10 animate-float">
                                    <RotateCw className="w-5 h-5 text-[#ef4444] animate-spin-slow" />
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-6 right-6 z-20">
                            <div className="glass-pro px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                               <Sparkles className="w-4 h-4 text-[#ef4444] animate-pulse" />
                               <span className="text-[11px] font-black text-white italic uppercase tracking-[0.2em]">{lastChapter || "LATEST"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-[#ef4444] italic uppercase tracking-[0.4em] opacity-80">
                                {category}
                            </span>
                            <div className="h-[2px] flex-grow bg-white/5 rounded-full" />
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black text-white italic leading-[0.85] uppercase tracking-tighter group-hover:text-[#ef4444] transition-all font-headline skew-x-[-2deg]">
                            {title}
                        </h3>
                        <p className="text-white/30 text-[13px] font-black uppercase tracking-widest line-clamp-2 italic leading-relaxed">
                            {description || "Khám phá câu chuyện hấp dẫn trong tác phẩm này, được tinh chỉnh chuẩn cinematic bởi Hồ Truyện Premium."}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                             <span className="text-6xl font-black text-white/5 italic font-headline -translate-x-4">#PREMIUM</span>
                             <div className="flex items-center gap-4 group/btn">
                                <span className="text-[13px] font-black text-white italic uppercase tracking-[0.3em] group-hover/btn:text-[#ef4444] transition-colors">
                                   BẮT ĐẦU ĐỌC
                                </span>
                                <div className="w-14 h-14 rounded-2xl bg-[#ef4444] flex items-center justify-center text-white shadow-cinematic-lg group-hover/btn:scale-110 transition-transform">
                                   <BookOpen className="w-6 h-6 fill-current" />
                                </div>
                             </div>
                        </div>
                    </div>
                </Link>
            </motion.div>
        );
    }

    // Default Vertical Card (Noir Grid Item)
    return (
        <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
        >
            <Link 
                href={`/truyen/${slug}`}
                className="group relative flex flex-col bg-[#0a0a0b] overflow-hidden border border-white/5 transition-all rounded-[40px] shadow-cinematic-xl active-depth hover:border-[#ef4444]/20"
                style={{ boxShadow: `0 0 50px -15px ${posterColor}20` }}
            >
                <div className="relative aspect-[3/4.5] w-full overflow-hidden">
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-50 group-hover:rotate-1"
                        unoptimized
                        priority={priority}
                    />
                    
                    {isSynced && (
                        <div className="absolute top-5 left-5 z-20">
                            <div className="glass-pro p-2.5 rounded-[18px] shadow-cinematic-xl border border-white/10 backdrop-blur-3xl">
                                <RotateCw className="w-4 h-4 text-[#ef4444] animate-spin-slow" />
                            </div>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#ef4444] flex items-center justify-center text-white shadow-cinematic-lg group-hover:scale-110 transition-transform duration-500">
                             <BookOpen className="w-6 h-6 fill-current" />
                          </div>
                          <span className="text-[11px] font-black text-white italic uppercase tracking-[0.3em]">READ NOW</span>
                       </div>
                    </div>

                    <div className="absolute top-5 right-5 z-20">
                       <div className="px-3 py-1.5 glass-pro rounded-xl border border-white/10 shadow-2xl">
                          <span className="text-[10px] font-black italic uppercase tracking-widest text-white/50">{lastChapter || "NEW"}</span>
                       </div>
                    </div>
                </div>
                
                <div className="p-8 flex flex-col gap-2 bg-[#0a0a0b]/10 backdrop-blur-3xl transition-all group-hover:translate-x-1">
                    <span className="text-[10px] font-black text-[#ef4444] italic uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-all">
                        {category}
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight uppercase italic tracking-tighter truncate group-hover:text-[#ef4444] transition-all font-headline">
                        {title}
                    </h3>
                </div>
            </Link>
        </motion.div>
    );
}

