"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Maximize, 
  Minimize, 
  Layout, 
  Image as ImageIcon,
  Menu,
  X,
  Plus,
  Minus,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard, Mousewheel, Virtual } from "swiper/modules";
import { useAuth } from "@/contexts/AuthContext";
import { saveComicHistory } from "@/services/comicDb";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/virtual";

// MangaDex-style reader: Long Strip vertical + Single Page horizontal
interface ChapterInfo {
  name: string;
  slug: string; // The chapter ID or name used in the URL
}

interface StitchMangaReaderProps {
  media: {
    id: string;
    title: string;
    imageUrl: string;
    images: string[];
    chapterName: string;
    slug: string; // comic slug
    chapters: ChapterInfo[]; // All chapters list for navigation
    activeSource: string;
  };
}

type ReadingMode = "longstrip" | "single";
type ImageFit = "width" | "height" | "original";

export function StitchMangaReader({ media }: StitchMangaReaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Settings (Persisted in LocalStorage)
  const [readingMode, setReadingMode] = useState<ReadingMode>("longstrip");
  const [imageFit, setImageFit] = useState<ImageFit>("width");
  const [showProgress, setShowProgress] = useState(true);
  
  // UI State
  const [showToolbar, setShowToolbar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const toolbarTimer = useRef<NodeJS.Timeout | null>(null);

  // Load Settings
  useEffect(() => {
    const savedMode = localStorage.getItem("stitch_reading_mode") as ReadingMode;
    const savedFit = localStorage.getItem("stitch_image_fit") as ImageFit;
    if (savedMode) setReadingMode(savedMode);
    if (savedFit) setImageFit(savedFit);
  }, []);

  // Save Settings
  const updateMode = (mode: ReadingMode) => {
    setReadingMode(mode);
    localStorage.setItem("stitch_reading_mode", mode);
  };

  const updateFit = (fit: ImageFit) => {
    setImageFit(fit);
    localStorage.setItem("stitch_image_fit", fit);
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Progress Tracker Logic
  const handleScroll = useCallback(() => {
    if (readingMode !== "longstrip" || !containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const totalContentHeight = scrollHeight - clientHeight;
    const scrollPos = Math.max(0, scrollTop);
    const progress = Math.min(100, (scrollPos / totalContentHeight) * 100);
    
    setReadingProgress(progress);
    
    // Page detection for progress bar labels
    const pageIdx = Math.floor((scrollPos / scrollHeight) * media.images.length) + 1;
    setCurrentPage(pageIdx);

    // Auto Hide Toolbar
    if (scrollTop > lastScrollTop.current && scrollTop > 200) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
    lastScrollTop.current = scrollTop;
  }, [readingMode, media.images.length]);

  // Sync Progress to Firebase
  useEffect(() => {
    if (!user) return;
    
    const timer = setTimeout(() => {
      saveComicHistory(user.uid, {
        comicSlug: media.slug,
        comicTitle: media.title,
        coverUrl: media.imageUrl,
        chapterSlug: media.chapterName,
        chapterName: media.chapterName,
        percent: Math.round(readingProgress)
      });
    }, 5000); // Debounced save

    return () => clearTimeout(timer);
  }, [readingProgress, user, media]);

  // Navigation Keys
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === "f") toggleFullscreen();
      if (e.key === "m") updateMode(readingMode === "longstrip" ? "single" : "longstrip");
      if (e.key === "Escape") setShowSettings(false);
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [readingMode]);

  // Chapter Navigation
  const currentIndex = media.chapters.findIndex(c => c.slug === media.chapterName);
  // Note: OTruyen chapters are usually DESC, so Prev is next index, Next is prev index.
  // We need to check the order. Usually index 0 is newest.
  const prevChapter = currentIndex < media.chapters.length - 1 ? media.chapters[currentIndex + 1] : null;
  const nextChapter = currentIndex > 0 ? media.chapters[currentIndex - 1] : null;

  const navigateToChapter = useCallback((chapterSlug: string) => {
    router.push(`/doc/${media.slug}/${chapterSlug}?source=${media.activeSource}`);
  }, [router, media.slug, media.activeSource]);

  const switchSource = (newSource: string) => {
    // Try to find the same chapter name in the current list of chapters
    // and navigate to it on the new source
    router.push(`/doc/${media.slug}/${media.chapterName}?source=${newSource}`);
  };

  return (
    <div className="fixed inset-0 bg-background text-on-surface theme-truyen z-50 flex flex-col overflow-hidden">
      
      {/* ---------------- TOP TOOLBAR - Pro Max Cinematic ---------------- */}
      <AnimatePresence>
        {showToolbar && (
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] pt-safe px-6 md:px-10 py-6 pointer-events-none"
          >
            <div className="glass-pro bg-black/40 rounded-[32px] border border-white/10 flex items-center justify-between px-8 py-4 pointer-events-auto h-20 shadow-cinematic-xl">
              <div className="flex items-center gap-6">
                <Link href={`/truyen/${media.slug}`} className="p-3 bg-white/5 hover:bg-[#ef4444] rounded-2xl transition-all shadow-lg active-depth group/back">
                  <ChevronLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                </Link>
                <div className="flex flex-col">
                  <h1 className="font-headline font-black text-[14px] md:text-2xl uppercase tracking-tighter truncate max-w-[150px] md:max-w-md italic flex items-center gap-2">
                    {media.title}
                  </h1>
                  <div className="flex items-center gap-3">
                     <div className="w-1 h-3 bg-[#ef4444] rounded-full" />
                     {/* Chapter Jump Dropdown */}
                      <select 
                          value={media.chapterName}
                          onChange={(e) => navigateToChapter(e.target.value)}
                          className="bg-transparent text-[10px] uppercase tracking-[0.4em] font-black text-[#ef4444] p-0 border-none focus:outline-none cursor-pointer hover:text-white transition-colors"
                      >
                          {media.chapters.map(c => (
                              <option key={c.slug} value={c.slug} className="bg-[#0a0a0b] text-white">Ch. {c.name}</option>
                          ))}
                      </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:gap-8">
                  {/* Source Quick Switcher - Pro Edition */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-[20px] border border-white/5">
                      {['otruyen', 'mangadex', 'mangaplus'].map(src => (
                          <button 
                              key={src}
                              onClick={() => switchSource(src)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  media.activeSource === src ? 'bg-[#ef4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-white/20 hover:text-white/60'
                              }`}
                          >
                              {src.slice(0, 3)}
                          </button>
                      ))}
                  </div>

                  <div className="hidden lg:flex items-center gap-3 bg-white/5 p-2 rounded-2xl">
                      <button 
                        disabled={!prevChapter}
                        onClick={() => prevChapter && navigateToChapter(prevChapter.slug)}
                        className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed group transition-all"
                      >
                        <ChevronLeft className="w-6 h-6 group-active:-translate-x-1 transition-transform" />
                      </button>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <button 
                        disabled={!nextChapter}
                        onClick={() => nextChapter && navigateToChapter(nextChapter.slug)}
                        className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed group transition-all"
                      >
                        <ChevronRight className="w-6 h-6 group-active:translate-x-1 transition-transform" />
                      </button>
                  </div>

                  <button 
                    onClick={() => setShowSettings(true)}
                    className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active-depth"
                  >
                    <Settings size={22} className="rotate-0 hover:rotate-90 transition-transform duration-500" />
                  </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main 
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-hide select-none transition-all duration-700 bg-[#050505] pb-24 md:pb-0 ${showToolbar ? 'pt-24' : 'pt-0'}`}
        onClick={() => {
          if (!showSettings) setShowToolbar(!showToolbar);
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex flex-col min-h-full">
          {readingMode === "longstrip" ? (
            /* LONG STRIP / VERTICAL */
            <div className="flex flex-col items-center">
              {media.images.map((url, idx) => (
                <div 
                  key={idx} 
                  data-page={idx + 1}
                  className={`relative w-full flex justify-center bg-[#050505] mb-2 ${
                    imageFit === 'width' ? 'w-full' : 
                    imageFit === 'height' ? 'h-screen' : ''
                  }`}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                >
                  <Image 
                    src={url}
                    alt={`Page ${idx + 1}`}
                    width={1200}
                    height={1800}
                    unoptimized
                    priority={idx < 2}
                    className={`${
                      imageFit === 'width' ? 'w-full max-w-[1000px] h-auto' : 
                      imageFit === 'height' ? 'h-full w-auto object-contain' : 
                      'w-auto h-auto'
                    } select-none transition-all duration-1000 shadow-cinematic-2xl`}
                  />
                  <div className="absolute top-8 right-8 text-[11px] font-black text-white/5 uppercase tracking-[0.4em] italic pointer-events-none">
                    PAGE {idx + 1} PROTOCOL
                  </div>
                </div>
              ))}
              
              {/* End of Chapter Splash */}
              <ChapterEndSplash 
                media={media} 
                nextChapter={nextChapter} 
                navigateToChapter={navigateToChapter} 
              />
            </div>
          ) : (
            /* SINGLE PAGE / SWIPER */
            <div className="w-full h-full flex-1 relative bg-[#050505]">
              <Swiper
                modules={[Navigation, Keyboard, Mousewheel, Virtual]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                  nextEl: ".swiper-next",
                  prevEl: ".swiper-prev",
                }}
                keyboard={{ enabled: true }}
                mousewheel={true}
                virtual
                onSlideChange={(s) => {
                  setCurrentPage(s.activeIndex + 1);
                  setReadingProgress((s.activeIndex / (media.images.length - 1)) * 100);
                }}
                className="w-full h-[calc(100vh-80px)]"
              >
                {media.images.map((url, idx) => (
                  <SwiperSlide key={idx} virtualIndex={idx}>
                    <div className="flex items-center justify-center w-full h-full overflow-hidden p-4 md:p-8">
                      <img 
                        src={url}
                        alt={`Page ${idx + 1}`}
                        className={`${
                          imageFit === 'width' ? 'w-full max-w-5xl h-auto shadow-cinematic-xl rounded-2xl' : 
                          imageFit === 'height' ? 'h-full w-auto object-contain' : 
                          'max-w-full max-h-full'
                        } transition-transform duration-500`}
                        style={{ transform: `scale(${zoom})` }}
                      />
                    </div>
                  </SwiperSlide>
                ))}
                
                {/* Last Slide: Splash */}
                <SwiperSlide virtualIndex={media.images.length}>
                   <div className="w-full h-full flex items-center justify-center">
                    <ChapterEndSplash 
                        media={media} 
                        nextChapter={nextChapter} 
                        navigateToChapter={navigateToChapter} 
                      />
                   </div>
                </SwiperSlide>

                {/* Custom Nav buttons */}
                <button className="swiper-prev absolute left-0 top-0 bottom-0 w-32 z-10 flex items-center justify-center group pointer-events-auto">
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-3xl border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-cinematic-lg">
                    <ChevronLeft size={40} className="text-[#ef4444]" />
                  </div>
                </button>
                <button className="swiper-next absolute right-0 top-0 bottom-0 w-32 z-10 flex items-center justify-center group pointer-events-auto">
                  <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-3xl border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-cinematic-lg">
                    <ChevronRight size={40} className="text-[#ef4444]" />
                  </div>
                </button>
              </Swiper>
            </div>
          )}
        </div>
      </main>

      {/* ---------------- BOTTOM PROGRESS BAR - Pro Max Cinematic ---------------- */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 px-10 pb-10 flex flex-col gap-4 shadow-cinematic-2xl transition-all duration-700 pointer-events-none ${showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="glass-pro bg-black/40 rounded-[40px] px-10 h-24 md:h-28 flex items-center justify-between border border-white/10 relative overflow-hidden pointer-events-auto group/bar">
          {/* Neural Background Glow */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-[#ef4444] shadow-[0_0_20px_#ef4444] transition-all duration-300 relative"
              style={{ width: `${readingProgress}%` }}
            >
               <div className="absolute top-0 right-0 w-12 h-full bg-white/40 blur-md animate-pulse" />
            </motion.div>
          </div>

          <div className="flex items-center gap-6 text-[12px] font-black uppercase tracking-[0.4em] text-[#ef4444] italic">
            <span className="bg-[#ef4444]/10 px-5 py-2.5 rounded-[18px]">PAGE {currentPage} / {media.images.length}</span>
            <span className="opacity-40 animate-pulse">{Math.round(readingProgress)}% COMPLETED</span>
          </div>

          <div className="flex items-center gap-8 group/ctrl">
             <button onClick={toggleFullscreen} className="p-4 bg-white/5 hover:bg-[#ef4444] rounded-2xl transition-all shadow-lg active-depth group/btn">
               {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
             </button>
             <div className="p-4 text-white/10 text-[10px] font-black uppercase tracking-widest italic hidden xl:block">
                READER ENGINE v2026
             </div>
          </div>
        </div>
      </footer>

      {/* ---------------- SETTINGS SIDE PANEL (MangaDex Style) ---------------- */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-surface z-[101] p-8 md:p-10 flex flex-col gap-10 overflow-y-auto border-l border-white/5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h2 className="font-headline font-black text-2xl uppercase tracking-tighter italic">Settings</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Mode Selection */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Reading Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <ModeOption 
                    active={readingMode === 'longstrip'}
                    onClick={() => updateMode('longstrip')}
                    label="Long Strip"
                    icon={<Layout className="w-4 h-4" />}
                    desc="Vertical Scroll"
                  />
                  <ModeOption 
                    active={readingMode === 'single'}
                    onClick={() => updateMode('single')}
                    label="Single Page"
                    icon={<ImageIcon className="w-4 h-4" />}
                    desc="Horizontal Swipe"
                  />
                </div>
              </div>

              {/* Fit Selection */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Image Fit</label>
                <div className="grid grid-cols-3 gap-2">
                  <FitOption active={imageFit === 'width'} label="Fit W" onClick={() => updateFit('width')} />
                  <FitOption active={imageFit === 'height'} label="Fit H" onClick={() => updateFit('height')} />
                  <FitOption active={imageFit === 'original'} label="Orig" onClick={() => updateFit('original')} />
                </div>
              </div>

              {/* Zoom Control */}
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Digital Zoom</label>
                <div className="flex items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><Minus size={16}/></button>
                   <span className="font-black text-lg">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><Plus size={16}/></button>
                   <button onClick={() => setZoom(1)} className="p-3 bg-white/5 rounded-xl text-primary"><RotateCcw size={16}/></button>
                </div>
              </div>

              {/* Key Shortcuts Info */}
              <div className="mt-auto bg-primary/5 p-6 rounded-[30px] border border-primary/10">
                 <h4 className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary mb-4">
                    <BookOpen size={14}/> Keyboard Shortcuts
                 </h4>
                 <ul className="space-y-3 text-xs text-on-surface-variant font-medium opacity-60">
                    <li className="flex justify-between"><span>Next Page</span> <kbd className="bg-white/10 px-2 py-0.5 rounded">Right/Space</kbd></li>
                    <li className="flex justify-between"><span>Prev Page</span> <kbd className="bg-white/10 px-2 py-0.5 rounded">Left</kbd></li>
                    <li className="flex justify-between"><span>Settings</span> <kbd className="bg-white/10 px-2 py-0.5 rounded">Escape</kbd></li>
                 </ul>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeOption({ active, onClick, label, icon, desc }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all duration-300 ${
        active 
          ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
      }`}
    >
      {icon}
      <div className="flex flex-col items-center">
        <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
        <span className="text-[8px] uppercase tracking-tighter opacity-50 font-bold">{desc}</span>
      </div>
    </button>
  );
}

function FitOption({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${
        active 
          ? 'bg-white text-black border-white' 
          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function ChapterEndSplash({ media, nextChapter, navigateToChapter }: any) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-12 bg-surface text-center gap-10 max-w-4xl mx-auto">
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          className="h-[2px] w-24 bg-primary mx-auto" 
        />
        <h2 className="font-headline font-black text-5xl md:text-8xl uppercase tracking-tighter leading-none drop-cap">
          Bạn Đã Hoàn Thành Chương Này
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
          {nextChapter && (
            <button 
              onClick={() => navigateToChapter(nextChapter)}
              className="bg-primary px-12 py-5 font-headline font-bold text-white uppercase tracking-widest editorial-shadow hover:scale-110 active:scale-95 transition-all"
            >
              Chương Tiếp Theo
            </button>
          )}
          <Link href={`/truyen/${media.slug}`} className="border border-outline px-12 py-5 font-headline font-bold text-on-surface uppercase tracking-widest hover:bg-surface-variant transition-all">
            Quay Lại Thư Viện
          </Link>
        </div>
    </div>
  );
}
