"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List as ListMenu, ArrowUp } from "lucide-react";
import { saveComicHistory } from "@/services/comicDb";
import { useAuth } from "@/contexts/AuthContext";

export function ComicReader({ slug, title, posterUrl, chapter, images, chaptersList }: {
  slug: string;
  title: string;
  posterUrl: string;
  chapter: string;
  images: string[];
  chaptersList: string[]; // Order depends on API, ascending or descending
}) {
  const { user } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showNav, setShowNav] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  const currentIndex = chaptersList.indexOf(chapter);
  
  const isAscending = parseFloat(chaptersList[0]) <= parseFloat(chaptersList[chaptersList.length - 1] || "0");
  
  let prevChapter: string | null = null;
  let nextChapter: string | null = null;

  if (isAscending) {
    if (currentIndex > 0) prevChapter = chaptersList[currentIndex - 1];
    if (currentIndex < chaptersList.length - 1) nextChapter = chaptersList[currentIndex + 1];
  } else {
    // index 0 is newest
    if (currentIndex < chaptersList.length - 1) prevChapter = chaptersList[currentIndex + 1];
    if (currentIndex > 0) nextChapter = chaptersList[currentIndex - 1];
  }

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

  useEffect(() => {
    const handleScroll = () => {
      const top = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.floor((top / docHeight) * 100));
      } else {
        setScrollProgress(100);
      }
      
      // Auto hide nav on scroll down, show on scroll up
      if (top > lastScrollTopRef.current && top > 100) {
        setShowNav(false);
      } else if (top < lastScrollTopRef.current) {
        setShowNav(true);
      }
      lastScrollTopRef.current = top;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans">
      {/* Top Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/truyen/${slug}`} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            <h1 className="text-[13px] sm:text-[14px] font-bold truncate max-w-[200px] sm:max-w-xs">{title}</h1>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white/80">
              Ch. {chapter}
            </span>
          </div>
        </div>
      </div>

      {/* Reader Images Container */}
      <div 
        ref={containerRef}
        className="w-full max-w-4xl mx-auto pt-14 pb-24 min-h-screen flex flex-col items-center bg-[#000]"
        onClick={() => setShowNav(!showNav)}
      >
        {images.map((imgUrl, idx) => (
          <img 
            key={idx}
            src={imgUrl}
            alt={`Page ${idx + 1}`}
            className="w-full h-auto block"
            loading={idx < 4 ? "eager" : "lazy"}
          />
        ))}

        {/* End of chapter controls */}
        <div className="w-full mt-10 p-6 flex flex-col items-center justify-center gap-4 border-t border-white/[0.06] pb-24">
           {nextChapter ? (
             <Link href={`/doc/${slug}/${nextChapter}`}>
                <button className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[15px] font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                  Chương Phía Sau
                </button>
             </Link>
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

           <div className="flex items-center gap-5">
             <Link href={prevChapter ? `/doc/${slug}/${prevChapter}` : "#"} className={!prevChapter ? "pointer-events-none opacity-30" : ""}>
               <button className="p-2 text-white/80 hover:text-white transition-colors bg-white/5 rounded-full" disabled={!prevChapter}>
                 <ChevronLeft className="w-5 h-5" />
               </button>
             </Link>

             <span className="text-[13px] font-bold text-white/80 min-w-[3rem] text-center w-12">
               {scrollProgress}%
             </span>

             <Link href={nextChapter ? `/doc/${slug}/${nextChapter}` : "#"} className={!nextChapter ? "pointer-events-none opacity-30" : ""}>
               <button className="p-2 text-white/80 hover:text-white transition-colors bg-white/5 rounded-full" disabled={!nextChapter}>
                 <ChevronRight className="w-5 h-5" />
               </button>
             </Link>
           </div>
         </div>
      </div>
    </div>
  );
}
