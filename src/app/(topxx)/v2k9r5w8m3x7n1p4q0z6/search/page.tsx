import { XXSearchResultsClient } from "@/components/movie/XXSearchResultsClient";
import { XXSearchBar } from "@/components/movie/XXSearchBar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface XXSearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function XXSearchPage({ searchParams }: XXSearchPageProps) {
  // FIXED TopXX full search by reusing instant search logic + safe Server Component
  try {
    const params = await searchParams;
    const q = params.q || "";
    const pageStr = params.page || "1";
    const currentPage = Math.max(1, parseInt(pageStr, 10));

    // Server-side logging for initial hit
    console.log("[TopXX Full Search] Received request for query:", q);

    return (
      <div className="flex flex-col gap-12 max-w-7xl mx-auto px-4 lg:px-12 py-16 mt-16 lg:mt-24 min-h-screen">
        {/* Search Header */}
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex flex-col gap-3">
             <div className="h-1.5 w-20 bg-yellow-500 rounded-full shadow-[0_0_20px_#fbbf24] animate-pulse" />
             <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white font-headline drop-shadow-2xl leading-none">
               KHO Tàng <span className="text-yellow-500 underline decoration-yellow-500/20 underline-offset-8">VIP</span>
             </h1>
             <p className="text-white/20 font-black uppercase tracking-[0.8em] text-[10px] italic pr-12">
               Phòng Lưu Trữ Phim Cao Cấp & Độc Quyền
             </p>
          </div>

          <XXSearchBar />
        </div>

        {/* Results Body - Delegated to Client for stability and parity with Instant Search */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-16 h-16 text-yellow-500/20 animate-spin" />
            <p className="text-white/5 text-[10px] font-black uppercase tracking-[0.8em] italic">Initializing Elite Search...</p>
          </div>
        }>
          <XXSearchResultsClient initialQuery={q} initialPage={currentPage} />
        </Suspense>
      </div>
    );
  } catch (error: any) {
    console.error("[TopXX Full Search] Server Component Fatal Error:", error);
    // Even if server logic above fails, we return a fallback that won't crash the whole route
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-[#0a0a0a]">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 ring-8 ring-red-500/5">
           <Loader2 className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Lỗi Đọc Dữ Liệu</h2>
        <p className="text-white/30 text-sm font-black uppercase tracking-widest leading-loose">Hệ thống đang được đồng bộ hóa. Vui lòng quay lại trong giây lát.</p>
        <a href="/v2k9r5w8m3x7n1p4q0z6/search" className="mt-12 px-12 py-5 bg-white text-black font-black uppercase italic tracking-widest rounded-full hover:bg-yellow-500 transition-all shadow-2xl inline-block">Thử Lại</a>
      </div>
    );
  }
}
