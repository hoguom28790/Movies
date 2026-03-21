"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List as ListMenu, ArrowUp, Settings, Maximize, Minimize, Settings2, Check } from "lucide-react";
import { saveComicHistory } from "@/services/comicDb";
import { useAuth } from "@/contexts/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { useRouter, useSearchParams } from "next/navigation";

type ReadingMode = "vertical" | "horizontal";
type ImageFit = "width" | "height" | "original";

// Added MangaPlus (official Shueisha) as third source for high-quality official manga
export function ComicReader({ slug, title, posterUrl, chapter, images, chaptersList, servers, currentServer, activeSource = "OTruyen" }: {
  slug: string;
  title: string;
  posterUrl: string;
  chapter: string;
  images: string[];
  chaptersList: string[]; // Usually comes unsorted. We must sort it to ensure Prev/Next logic is flawless.
  servers: string[];
  currentServer: string;
  activeSource?: "OTruyen" | "MangaDex" | "MangaPlus";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const AVAILABLE_SOURCES = ["OTruyen", "MangaDex", "MangaPlus"];

  // Sort chapters mathematically to ensure Prev/Next is always perfectly sequential regardless of API order
  const sortedChapters = [...chaptersList].sort((a, b) => {
    const numA = parseFloat(a.match(/[\d.]+/)?.[0] || "0");
    const numB = parseFloat(b.match(/[\d.]+/)?.[0] || "0");
    return numA - numB; // Ascending (1, 2, 3...)
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Settings State
  const [readingMode, setReadingMode] = useState<ReadingMode>("vertical");
  const [imageFit, setImageFit] = useState<ImageFit>("width");
  
  // UI State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNav, setShowNav] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Load user settings from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("reader_mode") as ReadingMode;
      const savedFit = localStorage.getItem("reader_fit") as ImageFit;
      if (savedMode) setReadingMode(savedMode);
      if (savedFit) setImageFit(savedFit);
    } catch(e) {}
  }, []);

  // Save user settings
  const updateSettings = (mode?: ReadingMode, fit?: ImageFit) => {
    if (mode) {
      setReadingMode(mode);
      localStorage.setItem("reader_mode", mode);
    }
    if (fit) {
      setImageFit(fit);
      localStorage.setItem("reader_fit", fit);
    }
  };

  const currentIndex = sortedChapters.indexOf(chapter);
  
  let prevChapter: string | null = null;
  let nextChapter: string | null = null;

  if (currentIndex > 0) prevChapter = sortedChapters[currentIndex - 1];
  if (currentIndex < sortedChapters.length - 1) nextChapter = sortedChapters[currentIndex + 1];

  const handleNavigateChapter = (targetChap: string | null) => {
    if (!targetChap) return;
    setToastMsg(`Đang chuyển sang chương ${targetChap}...`);
    router.push(`/doc/${slug}/${targetChap}?server=${currentServer}`);
  };

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        handleNavigateChapter(prevChapter);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        handleNavigateChapter(nextChapter);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, slug, currentServer]);

  const lastSavedProgress = useRef(-1);
  const lastSavedTime = useRef(0);

  useEffect(() => {
    // Save to history automatically with throttle
    if (user?.uid) {
      const now = Date.now();
      // Only save if progress changed by >= 5% OR it's 100% OR 5 seconds passed since last save and progress changed
      if (Math.abs(scrollProgress - lastSavedProgress.current) >= 5 || scrollProgress === 100 || (now - lastSavedTime.current > 5000 && scrollProgress !== lastSavedProgress.current)) {
        lastSavedProgress.current = scrollProgress;
        lastSavedTime.current = now;
        
        saveComicHistory(user.uid, {
          comicSlug: slug,
          comicTitle: title,
          coverUrl: posterUrl,
          chapterSlug: chapter,
          chapterName: chapter,
          percent: scrollProgress,
        }).catch(console.error);
      }
    }
  }, [scrollProgress, user, slug, chapter, title, posterUrl]);

  // Vertical Scroll Progress
  useEffect(() => {
    if (readingMode !== "vertical") return;
    
    const handleScroll = () => {
      const top = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      let progress = 0;
      let pageIndex = 1;

      if (docHeight > 0) {
        progress = Math.floor((top / docHeight) * 100);
        pageIndex = Math.min(Math.floor((top / docHeight) * images.length), images.length - 1) + 1;
      } else {
        progress = 100;
        pageIndex = images.length;
      }
      
      // Update page estimation for vertical
      setCurrentPage(pageIndex || 1);
      setScrollProgress(progress);
      
      // Auto hide nav on scroll down, show on scroll up
      if (top > lastScrollTopRef.current && top > 100) {
        setShowNav(false);
        setShowSettings(false);
      } else if (top < lastScrollTopRef.current) {
        setShowNav(true);
      }
      lastScrollTopRef.current = top;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingMode, images.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getImageContentClass = () => {
    if (readingMode === "horizontal") {
      if (imageFit === "width") return "w-full h-auto object-contain max-h-screen my-auto mx-auto border border-white/5 bg-[#050505]";
      if (imageFit === "height") return "h-screen w-auto object-contain my-auto mx-auto border border-white/5 bg-[#050505]";
      return "max-w-none w-auto h-auto my-auto mx-auto";
    } else {
      // vertical
      if (imageFit === "width") return "w-full max-w-4xl h-auto block";
      if (imageFit === "height") return "h-screen w-auto object-contain mx-auto block";
      return "w-auto max-w-none mx-auto block";
    }
  };

  return (
    <div className={`font-sans bg-[#050505] ${readingMode === "vertical" ? "min-h-screen" : "h-screen overflow-hidden"} flex flex-col`}>
      {/* Top Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/truyen/${slug}`} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            <h1 className="text-[13px] sm:text-[14px] font-bold truncate max-w-[200px] sm:max-w-xs">{title}</h1>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 relative">
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
               <Link href={prevChapter ? `/doc/${slug}/${prevChapter}?server=${currentServer}` : "#"} className={!prevChapter ? "pointer-events-none opacity-30" : ""}>
                 <button className="p-1.5 text-white/50 hover:text-white transition-colors bg-white/5 rounded-md hover:bg-white/10" disabled={!prevChapter}>
                   <ChevronLeft className="w-4 h-4" />
                 </button>
               </Link>
               <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white/80">
                 Ch. {chapter}
               </span>
               <Link href={nextChapter ? `/doc/${slug}/${nextChapter}?server=${currentServer}` : "#"} className={!nextChapter ? "pointer-events-none opacity-30" : ""}>
                 <button className="p-1.5 text-white/50 hover:text-white transition-colors bg-white/5 rounded-md hover:bg-white/10" disabled={!nextChapter}>
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </Link>
            </div>
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Source Switcher */}
            <div className="relative group mr-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-all text-[11px] font-bold border border-white/5 active:scale-95">
                Nguồn: <span className="text-primary uppercase">{activeSource}</span>
              </button>
              <div className="absolute top-10 right-0 w-32 bg-[#141416]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hidden group-hover:flex flex-col z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                {AVAILABLE_SOURCES.map((src) => (
                  <button 
                    key={src}
                    onClick={() => {
                      if (src === activeSource) return;
                      router.push(`/doc/${slug}/${chapter}?source=${src.toLowerCase()}`);
                    }}
                    className={`px-4 py-2.5 text-[12px] font-bold text-left transition-colors border-b border-white/5 last:border-none ${
                      src === activeSource ? "bg-primary text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={`p-2 transition-colors ${showSettings ? 'text-primary' : 'text-white/60 hover:text-white'}`}
            >
              <Settings2 className="w-5 h-5" />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div 
                className="absolute top-12 right-0 w-64 bg-[#141416]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/80 rounded-xl p-4 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest font-bold text-white/30 mb-2">Chế Độ Đọc (Page Layout)</h3>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => updateSettings("vertical")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${readingMode === "vertical" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                      Kéo dọc (Long Strip) {readingMode === "vertical" && <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => updateSettings("horizontal")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${readingMode === "horizontal" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                      Trang đơn (Kéo ngang) {readingMode === "horizontal" && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] uppercase tracking-widest font-bold text-white/30 mb-2">Vừa Vặn Ảnh (Image Fit)</h3>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => updateSettings(undefined, "width")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${imageFit === "width" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                      Vừa chiều rộng (Fit Width) {imageFit === "width" && <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => updateSettings(undefined, "height")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${imageFit === "height" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                      Vừa chiều cao (Fit Height) {imageFit === "height" && <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => updateSettings(undefined, "original")} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${imageFit === "original" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"}`}>
                      Kích thước gốc (Original) {imageFit === "original" && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                   <h3 className="text-[11px] uppercase tracking-widest font-bold text-white/30 mb-2 whitespace-nowrap">Nguồn Truyện (Source)</h3>
                   <div className="flex flex-col gap-1">
                     {AVAILABLE_SOURCES.map((src) => (
                       <button 
                         key={src}
                         onClick={() => {
                           router.push(`/doc/${slug}/${chapter}?source=${src.toLowerCase()}`);
                           setShowSettings(false);
                         }} 
                         className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeSource === src ? "bg-primary/20 text-primary border border-primary/20" : "text-white/70 hover:bg-white/5 border border-transparent"}`}
                       >
                         {src} {activeSource === src && <Check className="w-4 h-4" />}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-primary text-white px-6 py-3 rounded-full shadow-2xl shadow-primary/30 font-bold text-[14px] animate-in slide-in-from-top-4 fade-in duration-300">
          {toastMsg}
        </div>
      )}

      {/* Floating Side Navigation Buttons (Desktop/Tablet) */}
      <div className={`fixed inset-y-0 left-0 w-[15vw] max-w-[150px] z-40 flex items-center justify-start px-4 transition-opacity duration-300 ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {prevChapter && (
           <button 
             onClick={(e) => { e.stopPropagation(); handleNavigateChapter(prevChapter); }}
             className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 hover:scale-110 transition-all flex items-center justify-center shadow-2xl"
             title={`Chương ${prevChapter} (Phím ArrowLeft / A)`}
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
        )}
      </div>
      <div className={`fixed inset-y-0 right-0 w-[15vw] max-w-[150px] z-40 flex items-center justify-end px-4 transition-opacity duration-300 ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {nextChapter ? (
           <button 
             onClick={(e) => { e.stopPropagation(); handleNavigateChapter(nextChapter); }}
             className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 hover:scale-110 transition-all flex items-center justify-center shadow-2xl"
             title={`Chương ${nextChapter} (Phím ArrowRight / D)`}
           >
             <ChevronRight className="w-6 h-6" />
           </button>
        ) : (
           <button 
             disabled
             className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/40 flex items-center justify-center shadow-2xl text-[12px] font-bold"
           >
             Hết Truyện
           </button>
        )}
      </div>

      {/* Reader Images Container */}
      {readingMode === "vertical" ? (
        <div 
          ref={containerRef}
          className="w-full mx-auto pt-14 pb-24 min-h-screen flex flex-col items-center bg-[#050505] overflow-x-hidden"
          onClick={() => { setShowNav(!showNav); setShowSettings(false); }}
        >
          {images.map((imgUrl, idx) => (
            <img 
              key={idx}
              src={imgUrl}
              alt={`Page ${idx + 1}`}
              className={getImageContentClass()}
              loading={idx < 4 ? "eager" : "lazy"}
            />
          ))}

          {/* End of chapter controls */}
          <div className="w-full mt-10 p-6 flex flex-col items-center justify-center gap-4 border-t border-white/[0.06] pb-24">
             {nextChapter ? (
                <button onClick={() => handleNavigateChapter(nextChapter)} className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[15px] font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                  Chương Kế Tiếp
                </button>
             ) : (
               <button disabled className="px-8 py-3 rounded-xl bg-white/5 text-white/30 text-[15px] font-bold">
                 Cập Nhật Truyện Đang Chờ...
               </button>
             )}
             
             <button 
               onClick={(e) => { e.stopPropagation(); scrollToTop(); }}
               className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium transition-colors flex items-center gap-2 mt-4"
             >
               <ArrowUp className="w-4 h-4" /> Cuộn lên đầu
             </button>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full pt-14 pb-14 bg-[#050505] flex items-center justify-center relative touch-pan-x"
          onClick={() => { setShowNav(!showNav); setShowSettings(false); }}
        >
          <Swiper
            onSwiper={(s) => swiperRef.current = s}
            onSlideChange={(s) => {
              setCurrentPage(s.activeIndex + 1);
              setScrollProgress(Math.floor((s.activeIndex / (images.length - 1)) * 100));
            }}
            loop={false}
            spaceBetween={10}
            className="w-full h-full flex"
          >
            {images.map((imgUrl, idx) => (
              <SwiperSlide key={idx} className="flex items-center justify-center relative w-full h-full overflow-hidden">
                <div className="w-full h-full flex overflow-auto scrollbar-hide">
                  <img 
                    src={imgUrl}
                    alt={`Page ${idx + 1}`}
                    className={getImageContentClass()}
                    loading={idx < 3 ? "eager" : "lazy"}
                    onClick={(e) => e.stopPropagation()} // Let user double tap/zoom instead
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Transparent hitboxes for natural clicking */}
          <div className="absolute top-0 bottom-0 left-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); swiperRef.current?.slidePrev(); }} />
          <div className="absolute top-0 bottom-0 right-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); swiperRef.current?.slideNext(); }} />
          
          {/* Horizontal transition overlay at the end */}
          {currentPage === images.length && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 animate-in slide-in-from-right-10 fade-in">
               {nextChapter ? (
                  <button onClick={() => handleNavigateChapter(nextChapter)} className="flex items-center gap-2 px-6 py-3 rounded-l-full bg-primary hover:bg-primary-hover text-white text-[14px] font-bold transition-all shadow-xl shadow-primary/30">
                    Chương Tiếp <ChevronRight className="w-5 h-5" />
                  </button>
               ) : (
                 <div className="flex flex-col items-end gap-2 px-6 py-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
                    <span className="text-white/50 text-[12px] font-bold uppercase tracking-widest">Hết chương</span>
                    <span className="text-white text-[14px] font-medium">Chưa có tập mới</span>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
         {/* Progress bar */}
         <div className="absolute top-0 left-0 h-[3px] bg-primary/20 w-full" style={{ marginTop: '-3px' }}>
           <div className="h-full bg-primary transition-all duration-150 relative" style={{ width: `${scrollProgress}%` }}>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
           </div>
         </div>
         
         <div className="container mx-auto px-4 h-14 flex items-center justify-between">
           <Link href={`/truyen/${slug}`} className="p-2 text-white/60 hover:text-white transition-colors flex items-center gap-2">
             <ListMenu className="w-5 h-5" />
             <span className="text-[12px] font-medium hidden sm:block">Danh sách</span>
           </Link>

           <div className="flex items-center gap-1 sm:gap-5">
               <button onClick={() => handleNavigateChapter(prevChapter)} className="p-2 text-white/80 hover:text-white transition-colors bg-white/5 rounded-full" disabled={!prevChapter}>
                 <ChevronLeft className="w-5 h-5" />
               </button>

             <div className="flex items-center justify-center min-w-[5rem] text-center">
               <span className="text-[13px] font-bold text-white/90">{currentPage}</span>
               <span className="text-[13px] font-medium text-white/40 mx-1">/</span>
               <span className="text-[13px] font-medium text-white/50">{images.length}</span>
             </div>

               <button onClick={() => handleNavigateChapter(nextChapter)} className="p-2 text-white/80 hover:text-white transition-colors bg-white/5 rounded-full" disabled={!nextChapter}>
                 <ChevronRight className="w-5 h-5" />
               </button>
           </div>
         </div>
      </div>
    </div>
  );
}
