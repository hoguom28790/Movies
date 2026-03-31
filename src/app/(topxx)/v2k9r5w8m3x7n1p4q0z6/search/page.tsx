import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SearchResultsClient } from "@/components/movie/SearchResultsClient";
import { HomeSearchBar } from "@/components/movie/HomeSearchBar";
import { TOPXX_PATH } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TopXXSearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; page?: string }> 
}) {
  const params = await searchParams;
  const q = params.q || "";
  const currentPage = parseInt(params.page || "1", 10);

  try {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <div className="flex flex-col gap-12 mb-16 max-w-4xl mx-auto text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-foreground uppercase tracking-tighter italic">Tìm Kiếm</h1>
            <p className="text-foreground/20 text-xs font-black uppercase tracking-[0.4em] italic">Khám phá nội dung giải trí cao cấp</p>
          </div>

          <HomeSearchBar isXX />
        </div>

        {/* Results Body - Delegated to Client for stability and parity with Instant Search */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-16 h-16 text-yellow-500/20 animate-spin" />
            <p className="text-foreground/10 text-[10px] font-black uppercase tracking-[0.8em] italic">Initializing Elite Search...</p>
          </div>
        }>
          <SearchResultsClient initialQuery={q} initialPage={currentPage} isXX />
        </Suspense>
      </div>
    );
  } catch (error: any) {
    console.error("[TopXX Full Search] Server Component Fatal Error:", error);
    // Even if server logic above fails, we return a fallback that won't crash the whole route
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-background">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 ring-8 ring-red-500/5">
           <Loader2 className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter mb-4">Lỗi Đọc Dữ Liệu</h2>
        <p className="text-foreground/30 text-sm font-black uppercase tracking-widest leading-loose">Hệ thống đang được đồng bộ hóa. Vui lòng quay lại trong giây lát.</p>
        <a href={`/${TOPXX_PATH}/search`} className="mt-12 px-12 py-5 bg-foreground text-background font-black uppercase italic tracking-widest rounded-full hover:bg-yellow-500 hover:text-black transition-all shadow-2xl inline-block">Thử Lại</a>
      </div>
    );
  }
}
