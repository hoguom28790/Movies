"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List as ListMenu, ArrowUp, Maximize, Minimize, Settings2, Check, Sparkles, Layout, Monitor } from "lucide-react";
import { saveComicHistory } from "@/services/comicDb";
import { useAuth } from "@/contexts/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MangaPlusService } from "@/services/mangaplus";

type ReadingMode = "vertical" | "horizontal";
type ImageFit = "width" | "height" | "original";

const fetchChapterImages = async (source: string, slug: string, chapter: string, server?: string) => {
  const s = source.toLowerCase();
  
  if (s === "mangaplus") {
    const mpTitleBySlug = await MangaPlusService.searchTitle(slug.replace(/-/g, " "), 8);
    if (mpTitleBySlug) {
      const detail = await MangaPlusService.getTitleDetail(mpTitleBySlug.id);
      if (detail && detail.chapters) {
        const cleanChap = chapter.replace("Chương ", "").trim();
        const targetChap = detail.chapters.find((c: any) => c.name === cleanChap || c.name === chapter);
        if (targetChap) return await MangaPlusService.getPages(targetChap.id);
      }
    }
    return [];
  }

  if (s === "mangadex") {
    try {
      const searchRes = await fetch(`/api/mangadex/manga?title=${slug.replace(/-/g, " ")}&limit=1&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`);
      const searchData = await searchRes.json();
      const mangaId = searchData.data?.[0]?.id;
      if (!mangaId) return [];

      const cleanChap = chapter.replace("Chương ", "").trim();
      const feedRes = await fetch(`/api/mangadex/manga/${mangaId}/feed?translatedLanguage[]=vi&order[chapter]=desc&limit=100&chapter=${cleanChap}`);
      const feedData = await feedRes.json();
      
      const targetChap = feedData.data?.find((c: any) => c.attributes.chapter === cleanChap);
      if (targetChap) {
        const atHomeRes = await fetch(`/api/mangadex/at-home/server/${targetChap.id}`);
        const atHomeData = await atHomeRes.json();
        const base = atHomeData.baseUrl;
        const hash = atHomeData.chapter.hash;
        return atHomeData.chapter.data.map((img: string) => `${base}/data/${hash}/${img}`);
      }
    } catch(e) { console.error("MangaDex fetch failed:", e); }
    return [];
  }

  if (s === "otruyen") {
    const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    const data = await res.json();
    const serverData = data.data.item.chapters.find((s: any) => s.server_name === (server || data.data.item.chapters[0].server_name));
    const chapterData = serverData?.server_data.find((c: any) => c.chapter_name === chapter);
    
    if (chapterData) {
      const apiRes = await fetch(chapterData.chapter_api_data);
      const apiData = await apiRes.json();
      const domainCdn = apiData.data.domain_cdn;
      return apiData.data.item.chapter_image.map((img: any) => `${domainCdn}/${apiData.data.item.chapter_path}/${img.image_file}`);
    }
  }
  
  return [];
};

export function ComicReader({ slug, title, posterUrl, chapter, images: initialImages, chaptersList, servers, currentServer, activeSource: initialSource = "OTruyen" }: {
  slug: string; title: string; posterUrl: string; chapter: string; images: string[]; chaptersList: string[]; servers: string[]; currentServer: string; activeSource?: "OTruyen" | "MangaDex" | "MangaPlus";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState(initialSource);

  const { data: images = initialImages, isLoading, isFetching } = useQuery({
    queryKey: ['chapter-content', selectedSource, slug, chapter],
    queryFn: () => fetchChapterImages(selectedSource, slug, chapter, currentServer),
    initialData: selectedSource === initialSource ? initialImages : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!slug && !!chapter,
  });

  const AVAILABLE_SOURCES = ["OTruyen", "MangaDex", "MangaPlus"];

  const sortedChapters = [...chaptersList].sort((a, b) => {
    const numA = parseFloat(a.match(/[\d.]+/)?.[0] || "0");
    const numB = parseFloat(b.match(/[\d.]+/)?.[0] || "0");
    return numA - numB;
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState<ReadingMode>("vertical");
  const [imageFit, setImageFit] = useState<ImageFit>("width");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNav, setShowNav] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("reader_mode") as ReadingMode;
      const savedFit = localStorage.getItem("reader_fit") as ImageFit;
      if (savedMode) setReadingMode(savedMode);
      if (savedFit) setImageFit(savedFit);
    } catch(e) {}
  }, []);

  const updateSettings = (mode?: ReadingMode, fit?: ImageFit) => {
    if (mode) { setReadingMode(mode); localStorage.setItem("reader_mode", mode); }
    if (fit) { setImageFit(fit); localStorage.setItem("reader_fit", fit); }
  };

  const currentIndex = sortedChapters.indexOf(chapter);
  let prevChapter: string | null = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  let nextChapter: string | null = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  const handleNavigateChapter = (targetChap: string | null) => {
    if (!targetChap) return;
    setToastMsg(`Chuyển sang chương ${targetChap}...`);
    router.push(`/doc/${slug}/${targetChap}?server=${currentServer}&source=${selectedSource}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") handleNavigateChapter(prevChapter);
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") handleNavigateChapter(nextChapter);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, slug, currentServer]);

  const lastSavedProgress = useRef(-1);
  const lastSavedTime = useRef(0);

  useEffect(() => {
    if (user?.uid) {
      const now = Date.now();
      if (Math.abs(scrollProgress - lastSavedProgress.current) >= 5 || scrollProgress === 100 || (now - lastSavedTime.current > 5000 && scrollProgress !== lastSavedProgress.current)) {
        lastSavedProgress.current = scrollProgress;
        lastSavedTime.current = now;
        saveComicHistory(user.uid, { comicSlug: slug, comicTitle: title, coverUrl: posterUrl, chapterSlug: chapter, chapterName: chapter, percent: scrollProgress }).catch(console.error);
      }
    }
  }, [scrollProgress, user, slug, chapter, title, posterUrl]);

  useEffect(() => {
    if (readingMode !== "vertical") return;
    const handleScroll = () => {
      const top = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      let progress = docHeight > 0 ? Math.floor((top / docHeight) * 100) : 100;
      let pageIndex = docHeight > 0 ? Math.min(Math.floor((top / docHeight) * images.length), images.length - 1) + 1 : images.length;
      setCurrentPage(pageIndex || 1);
      setScrollProgress(progress);
      if (top > lastScrollTopRef.current && top > 100) { setShowNav(false); setShowSettings(false); setShowSource(false); }
      else if (top < lastScrollTopRef.current) setShowNav(true);
      lastScrollTopRef.current = top;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingMode, images.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(console.error); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const getImageContentClass = () => {
    if (readingMode === "horizontal") {
      if (imageFit === "width") return "w-full h-auto object-contain max-h-screen my-auto mx-auto border border-white/5 bg-[#050505]";
      if (imageFit === "height") return "h-screen w-auto object-contain my-auto mx-auto border border-white/5 bg-[#050505]";
      return "max-w-none w-auto h-auto my-auto mx-auto";
    }
    if (imageFit === "width") return "w-full max-w-4xl h-auto block";
    if (imageFit === "height") return "h-screen w-auto object-contain mx-auto block";
    return "w-auto max-w-none mx-auto block";
  };

  return (
    <div className={`font-sans bg-[#050505] ${readingMode === "vertical" ? "min-h-screen" : "h-screen overflow-hidden"} flex flex-col selection:bg-primary selection:text-white`}>
      {/* Top Navbar - Glass Pro */}
      <AnimatePresence>
        {showNav && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[100] pt-safe flex justify-center p-4 md:p-6 pointer-events-none"
          >
            <div className="glass-pro rounded-[28px] px-6 h-16 md:h-20 flex items-center justify-between gap-6 pointer-events-auto w-full max-w-7xl shadow-cinematic-xl border border-white/10">
              <Link href={`/truyen/${slug}`} className="flex items-center gap-4 text-white/40 hover:text-white transition-all group max-w-[40%]">
                <div className="p-2 sm:p-3 rounded-2xl bg-white/5 group-hover:bg-primary transition-colors">
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="flex flex-col overflow-hidden">
                   <h1 className="text-[13px] md:text-[15px] font-black italic uppercase italic tracking-tight truncate leading-none">{title}</h1>
                   <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hidden sm:block mt-1">Reader Premium</span>
                </div>
              </Link>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-white/5 border border-white/5">
                   <button onClick={() => handleNavigateChapter(prevChapter)} className="p-2 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-xl disabled:opacity-0" disabled={!prevChapter}>
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                   <div className="px-4 py-1.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase italic tracking-widest shadow-lg shadow-primary/30">
                     CH. {chapter}
                   </div>
                   <button onClick={() => handleNavigateChapter(nextChapter)} className="p-2 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-xl disabled:opacity-0" disabled={!nextChapter}>
                     <ChevronRight className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex items-center gap-1.5">
                   <button onClick={toggleFullscreen} className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                     {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                   </button>
                   
                   <div className="relative">
                      <button onClick={() => { setShowSource(!showSource); setShowSettings(false); }} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 transition-all text-[11px] font-black uppercase italic tracking-widest border border-white/10 shadow-sm active-depth">
                        <Sparkles className="w-4 h-4 text-primary" /> {selectedSource}
                      </button>
                      <AnimatePresence>
                        {showSource && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-3 w-48 z-50 glass-pro rounded-3xl border border-white/10 p-2 shadow-cinematic-xl overflow-hidden">
                            {AVAILABLE_SOURCES.map((src) => (
                              <button key={src} onClick={() => { if (src === selectedSource) return; setSelectedSource(src as any); setShowSource(false); router.push(`/doc/${slug}/${chapter}?server=${currentServer}&source=${src}`); }} className={`flex items-center justify-between w-full px-5 py-3 text-[11px] font-black uppercase italic tracking-widest rounded-2xl transition-all ${src === selectedSource ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:text-white hover:bg-white/10"}`}>
                                {src} {src === selectedSource && <Check className="w-4 h-4 stroke-[3px]" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>

                   <button onClick={() => { setShowSettings(!showSettings); setShowSource(false); }} className={`p-3 rounded-2xl transition-all ${showSettings ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                     <Settings2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel - Glass Pro */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-24 md:top-28 right-4 md:right-10 w-80 glass-pro border border-white/10 shadow-cinematic-2xl rounded-[40px] p-8 z-[110] flex flex-col gap-8"
          >
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-1.5 h-6 rounded-full bg-primary" />
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 italic italic">Reading Mode</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => updateSettings("vertical")} className={`flex items-center justify-between px-6 py-4 rounded-3xl text-[13px] font-black uppercase italic transition-all ${readingMode === "vertical" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/5 text-white/30 hover:text-white"}`}>
                    <div className="flex items-center gap-4"><Layout className="w-4 h-4" /> Vertical Strip</div>
                    {readingMode === "vertical" && <Check className="w-4 h-4 stroke-[3px]" />}
                  </button>
                  <button onClick={() => updateSettings("horizontal")} className={`flex items-center justify-between px-6 py-4 rounded-3xl text-[13px] font-black uppercase italic transition-all ${readingMode === "horizontal" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/5 text-white/30 hover:text-white"}`}>
                    <div className="flex items-center gap-4"><Monitor className="w-4 h-4" /> Horizontal Page</div>
                    {readingMode === "horizontal" && <Check className="w-4 h-4 stroke-[3px]" />}
                  </button>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-1.5 h-6 rounded-full bg-white/10" />
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 italic">Image Alignment</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => updateSettings(undefined, "width")} className={`flex items-center justify-between px-6 py-3.5 rounded-3xl text-[12px] font-bold transition-all ${imageFit === "width" ? "text-primary bg-primary/10" : "text-white/30 hover:text-white bg-white/5 border border-white/5"}`}>
                    Fit To Width {imageFit === "width" && <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => updateSettings(undefined, "height")} className={`flex items-center justify-between px-6 py-3.5 rounded-3xl text-[12px] font-bold transition-all ${imageFit === "height" ? "text-primary bg-primary/10" : "text-white/30 hover:text-white bg-white/5 border border-white/5"}`}>
                    Fit To Height {imageFit === "height" && <Check className="w-4 h-4" />}
                  </button>
                </div>
             </div>
             
             <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/20 italic font-medium leading-relaxed">System automatically syncs your progress to Hồ Truyện Cloud 2026.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] glass-pro text-white px-8 py-4 rounded-[28px] shadow-cinematic-xl border border-primary/20 font-black text-[13px] uppercase italic tracking-widest flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Content */}
      {images.length === 0 ? (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#050505] text-center px-8">
          <div className="w-32 h-32 mb-10 glass-pro rounded-[48px] flex items-center justify-center text-primary shadow-cinematic-2xl border border-primary/10">
            <ListMenu className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-widest text-white/90 mb-4">No content found</h2>
          <p className="text-white/30 max-w-sm mb-12 text-[13px] leading-relaxed">The source <span className="text-primary font-black uppercase">{selectedSource}</span> has no data. Try switching to <span className="text-primary font-black uppercase">OTruyen</span>.</p>
          <button onClick={() => { setSelectedSource("OTruyen"); router.push(`/doc/${slug}/${chapter}?server=${currentServer}&source=OTruyen`); }} className="px-12 py-5 rounded-[32px] bg-primary text-white font-black uppercase italic tracking-widest shadow-cinematic-xl hover:scale-105 transition-all active-depth">Switch To OTruyen</button>
        </div>
      ) : readingMode === "vertical" ? (
        <div ref={containerRef} className="w-full mx-auto pt- safe pb-32 min-h-screen flex flex-col items-center bg-[#050505]" onClick={() => { setShowNav(!showNav); setShowSettings(false); setShowSource(false); }}>
          {images.map((imgUrl: string, idx: number) => (
            <img key={idx} src={imgUrl} alt={`Page ${idx + 1}`} className={getImageContentClass()} loading={idx < 4 ? "eager" : "lazy"} />
          ))}

          <div className="w-full mt-20 p-12 flex flex-col items-center justify-center gap-8 border-t border-white/[0.06] pb-40">
             {nextChapter ? (
                <button onClick={() => handleNavigateChapter(nextChapter)} className="group px-16 py-6 rounded-[40px] bg-primary hover:bg-primary-hover text-white text-[16px] font-black uppercase italic tracking-[0.2em] transition-all shadow-cinematic-xl hover:scale-105 active:scale-95 flex items-center gap-4">
                  Next Chapter <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
             ) : (
                <div className="px-10 py-5 rounded-[32px] glass-pro border border-white/10 text-white/30 text-[14px] font-black uppercase italic">To Be Continued...</div>
             )}
             <button onClick={(e) => { e.stopPropagation(); scrollToTop(); }} className="px-8 py-4 rounded-[28px] bg-white/5 hover:bg-white/10 text-white/40 text-[12px] font-black uppercase tracking-widest italic transition-all border border-white/5 flex items-center gap-3">
               <ArrowUp className="w-4 h-4" /> Scroll To Top
             </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full pt-14 pb-14 bg-[#0a0a0a] flex items-center justify-center relative touch-pan-x" onClick={() => { setShowNav(!showNav); setShowSettings(false); setShowSource(false); }}>
          <Swiper onSwiper={(s) => swiperRef.current = s} onSlideChange={(s) => { setCurrentPage(s.activeIndex + 1); setScrollProgress(Math.floor((s.activeIndex / (images.length - 1)) * 100)); }} loop={false} spaceBetween={20} className="w-full h-full flex">
            {images.map((imgUrl: string, idx: number) => (
              <SwiperSlide key={idx} className="flex items-center justify-center w-full h-full overflow-hidden">
                <div className="w-full h-full flex overflow-auto scrollbar-hide py-20 px-4 md:px-0">
                  <img src={imgUrl} alt={`Page ${idx + 1}`} className={getImageContentClass()} loading={idx < 3 ? "eager" : "lazy"} onClick={(e) => e.stopPropagation()} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <div className="absolute top-0 bottom-0 left-0 w-1/6 z-10 cursor-w-resize" onClick={(e) => { e.stopPropagation(); swiperRef.current?.slidePrev(); }} />
          <div className="absolute top-0 bottom-0 right-0 w-1/6 z-10 cursor-e-resize" onClick={(e) => { e.stopPropagation(); swiperRef.current?.slideNext(); }} />
          
          {currentPage === images.length && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="absolute right-10 top-1/2 -translate-y-1/2 z-20">
               {nextChapter ? (
                  <button onClick={() => handleNavigateChapter(nextChapter)} className="group flex items-center gap-4 px-10 py-5 rounded-[32px] bg-primary text-white text-[14px] font-black uppercase italic shadow-cinematic-2xl hover:scale-110 transition-all">
                    Next <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
               ) : (
                  <div className="p-6 rounded-3xl glass-pro border border-white/10 shadow-2xl flex flex-col items-end">
                    <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Endpoint</span>
                    <span className="text-white/60 text-[14px] font-black italic">Completed</span>
                  </div>
               )}
            </motion.div>
          )}
        </div>
      )}

      {/* Bottom Interface - Premium Cinematic */}
      <AnimatePresence>
        {showNav && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[100] pb-safe flex flex-col items-center pointer-events-none"
          >
            <div className="w-full max-w-7xl px-4 md:px-10 pb-8 pointer-events-auto">
               <div className="relative glass-pro bg-black/40 rounded-[40px] px-10 h-24 md:h-28 flex items-center justify-between border border-white/10 shadow-cinematic-2xl overflow-hidden group/bar">
                  {/* Neural Background Glow */}
                  <div className="absolute inset-0 bg-[#ef4444]/5 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-1000" />
                  
                  {/* Premium Progress Protocol */}
                  <div className="absolute top-0 left-0 h-1.5 w-full bg-white/5">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${scrollProgress}%` }} 
                        className="h-full bg-[#ef4444] shadow-[0_0_25px_#ef4444] transition-all duration-300 relative"
                     >
                        <div className="absolute top-0 right-0 w-8 h-full bg-white/40 blur-md animate-pulse" />
                     </motion.div>
                  </div>

                  <Link href={`/truyen/${slug}`} className="p-4 text-white/40 hover:text-white transition-all bg-white/5 rounded-2xl hover:bg-[#ef4444] hover:shadow-[0_0_20px_#ef444460] group/back">
                    <ListMenu className="w-6 h-6 group-hover/back:rotate-180 transition-transform duration-700" />
                  </Link>

                  <div className="flex items-center gap-10 md:gap-16">
                      <button onClick={() => handleNavigateChapter(prevChapter)} className="p-4 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-2xl disabled:opacity-0" disabled={!prevChapter}>
                        <ChevronLeft className="w-8 h-8 stroke-[3px]" />
                      </button>

                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center font-black italic text-white text-3xl tracking-tighter drop-shadow-2xl">
                        <span className="text-[#ef4444]">{currentPage}</span>
                        <span className="text-white/20 mx-3 text-2xl font-normal opacity-40">/</span>
                        <span className="text-white/40 text-2xl">{images.length}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hidden sm:block italic">ARCHIVE PAGE PROTOCOL</span>
                    </div>

                      <button onClick={() => handleNavigateChapter(nextChapter)} className="p-4 text-white/30 hover:text-white transition-all hover:bg-white/5 rounded-2xl disabled:opacity-0" disabled={!nextChapter}>
                        <ChevronRight className="w-8 h-8 stroke-[3px]" />
                      </button>
                  </div>

                  <div className="p-4 text-[#ef4444] text-[11px] font-black uppercase tracking-[0.3em] italic hidden md:block opacity-40 group-hover:opacity-100 transition-opacity">
                     NOIR EDITION 2026
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

