"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Info, Sparkles, Star, TrendingUp } from 'lucide-react';

interface StitchHeroProps {
    title: string;
    description: string;
    imageUrl: string;
    slug: string;
    category?: string;
    priority?: boolean;
    posterColor?: string;
    secondaryComics?: any[]; // For the bento showcase
}

export function StitchHero({ 
    title, 
    description, 
    imageUrl, 
    slug, 
    category = "Phát hành mới", 
    priority = true, 
    posterColor,
    secondaryComics = []
}: StitchHeroProps) {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 1.1]);

    const words = title.split(' ');
    const firstWord = words[0];
    const rest = words.slice(1).join(' ');

    return (
        <section className="relative h-[90vh] md:h-[950px] w-full overflow-hidden flex items-center bg-[#050505]">
            {/* Cinematic Neural Background */}
            <motion.div style={{ y: y1, scale, opacity }} className="absolute inset-0 z-0">
                <Image 
                    src={imageUrl} 
                    alt={title} 
                    fill 
                    className="object-cover opacity-60 md:opacity-80 transition-all duration-1000 grayscale-[0.3] brightness-75 scale-105"
                    unoptimized
                    priority={priority}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/20 to-transparent" />
                
                {/* Dynamic Neural Blurs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#ef4444]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#ef4444]/5 rounded-full blur-[100px] animate-pulse delay-700" />
            </motion.div>
            
            <div className="relative z-10 px-8 md:px-24 w-full max-w-7xl mt-12 sm:mt-24">
                <div className="flex flex-col gap-8 md:gap-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.8 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-1.5 h-10 bg-[#ef4444] rounded-full shadow-[0_0_15px_#ef4444]" />
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#ef4444] italic">
                                {category}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                               <TrendingUp className="w-3 h-3 text-white/40" />
                               <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic">TOP READING PROTOCOL v2026</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                       initial={{ opacity: 0, y: 50 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                       className="space-y-4"
                    >
                        <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.8] mb-4 font-headline drop-shadow-2xl skew-x-[-2deg]">
                            <span className="text-white block">{firstWord}</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ef4444] to-[#ef4444]/40 italic block -mt-2">
                               {rest || "ARCHIVE"}
                            </span>
                        </h1>
                        
                        <div className="max-w-xl space-y-10">
                            <p className="text-white/50 text-base md:text-lg leading-relaxed font-black uppercase tracking-widest italic opacity-80 line-clamp-3">
                                {description || "Khám phá siêu phẩm đang thịnh hành nhất trên Hồ Truyện, với cốt truyện lôi cuốn và hình ảnh sắc nét chuẩn cinematic cho trải nghiệm tốt nhất."}
                            </p>
                            
                            <div className="flex flex-wrap gap-6 pt-4">
                                <Link 
                                    href={`/truyen/${slug}`}
                                    className="group/btn relative px-10 md:px-14 py-5 bg-[#ef4444] text-white rounded-[24px] overflow-hidden shadow-cinematic-xl active-depth transition-all hover:scale-105"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                    <div className="flex items-center gap-4 relative z-10">
                                       <Play className="w-6 h-6 fill-current" />
                                       <span className="text-[14px] font-black uppercase tracking-[0.3em] italic">ĐỌC NGAY</span>
                                    </div>
                                </Link>
                                
                                <Link 
                                    href={`/truyen/${slug}`}
                                    className="px-10 md:px-14 py-5 glass-pro text-white rounded-[24px] border border-white/10 shadow-2xl active-depth transition-all hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                       <Info className="w-6 h-6" />
                                       <span className="text-[14px] font-black uppercase tracking-[0.3em] italic">CHI TIẾT</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bento Showcase Thumbnail for Tablet/Desktop */}
            <div className="absolute bottom-16 right-24 hidden xl:block w-[450px]">
                <div className="grid grid-cols-2 gap-6 rotate-[-4deg] scale-110">
                    {secondaryComics?.slice(0, 2).map((comic: any, i: number) => (
                        <motion.div
                            key={comic.slug}
                            initial={{ opacity: 0, scale: 0.8, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: 0.8 + (i * 0.2), duration: 0.8 }}
                            className="group relative aspect-[2/3] rounded-[32px] overflow-hidden border-4 border-white/5 shadow-cinematic-2xl hover:scale-110 hover:z-20 transition-all duration-700"
                        >
                            <Image 
                                src={comic.imageUrl} 
                                alt={comic.title} 
                                fill 
                                className="object-cover transition-all duration-1000 group-hover:rotate-3 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-6 left-6 right-6">
                               <p className="text-[10px] font-black text-white italic uppercase tracking-widest line-clamp-1">{comic.title}</p>
                            </div>
                        </motion.div>
                    ))}
                    <div className="aspect-[2/3] rounded-[32px] glass-pro border-4 border-white/5 shadow-cinematic-2xl flex flex-col items-center justify-center p-8 gap-4">
                       <Sparkles className="w-10 h-10 text-[#ef4444] animate-pulse" />
                       <span className="text-[10px] font-black text-white/30 text-center uppercase tracking-[0.3em] italic leading-tight">PREMIUM NOIR EDITORIAL ARCHIVE</span>
                       <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" />)}
                       </div>
                    </div>
                </div>
            </div>

            {/* Premium Noir Sidemark */}
            <div className="absolute top-1/2 right-12 hidden lg:block rotate-90 origin-right translate-y-[-50%]">
                <span className="text-[12rem] font-black text-white/[0.02] uppercase tracking-tighter select-none font-headline whitespace-nowrap">NOIR EDITION 2026</span>
            </div>
            
            {/* Scroll Indicator Protocol */}
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 2 }}
               className="absolute bottom-12 left-1/2 translate-x-[-50%] flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-opacity"
            >
               <span className="text-[9px] font-black text-white uppercase tracking-[0.4em] italic">Discover More</span>
               <div className="w-1 h-12 rounded-full overflow-hidden bg-white/10">
                  <motion.div 
                    animate={{ y: [0, 48, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-full h-1/2 bg-[#ef4444]"
                  />
               </div>
            </motion.div>
        </section>
    );
}

