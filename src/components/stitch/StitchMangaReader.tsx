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
      
      {/* ---------------- TOP TOOLBAR ---------------- */}
      <AnimatePresence>
        {showToolbar && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-8 py-3"
          >
            <div className="flex items-center gap-4">
              <Link href={`/truyen/${media.slug}`} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </Link>
              <div className="flex flex-col">
                <h1 className="font-headline font-black text-[12px] md:text-xl uppercase tracking-tighter truncate max-w-[120px] md:max-w-md">
                  {media.title}
                </h1>
                <div className="flex items-center gap-2">
                   {/* Chapter Jump Dropdown */}
                    <select 
                        value={media.chapterName}
                        onChange={(e) => navigateToChapter(e.target.value)}
                        className="bg-transparent text-[10px] uppercase tracking-[0.2em] font-black text-primary p-0 border-none focus:outline-none cursor-pointer hover:bg-white/5 rounded px-1 transition-colors"
                    >
                        {media.chapters.map(c => (
                            <option key={c.slug} value={c.slug} className="bg-surface text-on-surface">Ch. {c.name}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                {/* Source Quick Switcher */}
                <div className="hidden sm:flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
                    {['otruyen', 'mangadex', 'mangaplus'].map(src => (
                        <button 
                            key={src}
                            onClick={() => switchSource(src)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                media.activeSource === src ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {src.slice(0, 3)}
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
                        <select 
                            value={currentPage}
                            onChange={(e) => {
                                const page = parseInt(e.target.value);
                                if (readingMode === 'longstrip' && containerRef.current) {
                                    const img = containerRef.current.querySelector(`[data-page="${page}"]`);
                                    img?.scrollIntoView({ behavior: 'smooth' });
                                }
                                setCurrentPage(page);
                            }}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 py-1.5 focus:outline-none cursor-pointer"
                        >
                            {media.images.map((_, i) => (
                                <option key={i} value={i + 1} className="bg-surface">Page {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <button 
                  disabled={!prevChapter}
                  onClick={() => prevChapter && navigateToChapter(prevChapter.slug)}
                  className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
                >
                  <ChevronLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
                </button>
                <span className="px-3 text-[10px] font-black uppercase tracking-widest hidden sm:block">NAV</span>
                <button 
                  disabled={!nextChapter}
                  onClick={() => nextChapter && navigateToChapter(nextChapter.slug)}
                  className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
                >
                  <ChevronRight className="w-5 h-5 group-active:translate-x-1 transition-transform" />
                </button>
              </div>

              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-primary-container hover:text-on-primary-container rounded-full transition-all editorial-shadow"
              >
                <Settings size={20} />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main 
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-hide select-none transition-all duration-500 pb-20 md:pb-0 ${showToolbar ? 'pt-20' : 'pt-0'}`}
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
                  className={`relative w-full flex justify-center bg-surface-container-low/5 mb-2 ${
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
                    } select-none transition-all duration-700`}
                  />
                  <div className="absolute top-4 right-4 text-[9px] font-black text-white/10 uppercase tracking-widest">
                    P. {idx + 1}
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
            <div className="w-full h-full flex-1 relative bg-black">
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
                    <div className="flex items-center justify-center w-full h-full overflow-hidden p-2 md:p-4">
                      <img 
                        src={url}
                        alt={`Page ${idx + 1}`}
                        className={`${
                          imageFit === 'width' ? 'w-full max-w-4xl h-auto' : 
                          imageFit === 'height' ? 'h-full w-auto object-contain' : 
                          'max-w-full max-h-full'
                        } transition-transform duration-300`}
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
                <button className="swiper-prev absolute left-0 top-0 bottom-0 w-24 z-10 flex items-center justify-center group">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={32} />
                  </div>
                </button>
                <button className="swiper-next absolute right-0 top-0 bottom-0 w-24 z-10 flex items-center justify-center group">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={32} />
                  </div>
                </button>
              </Swiper>
            </div>
          )}
        </div>
      </main>

      {/* ---------------- BOTTOM PROGRESS BAR ---------------- */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 px-6 py-4 flex flex-col gap-4 shadow-2xl transition-all duration-500 ${showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-primary">
            <span className="bg-primary/10 px-3 py-1 rounded-lg">P. {currentPage} / {media.images.length}</span>
            <span className="opacity-40">{Math.round(readingProgress)}%</span>
          </div>

          <div className="flex-1 max-w-2xl h-1 bg-white/10 rounded-full group cursor-pointer relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary group-hover:bg-primary-hover transition-all shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
              style={{ width: `${readingProgress}%` }}
            />
          </div>

          <div className="flex items-center gap-4">
             <button onClick={toggleFullscreen} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
               {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
             </button>
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
