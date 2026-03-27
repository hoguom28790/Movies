import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SearchResultsClient } from "@/components/movie/SearchResultsClient";
import { HomeSearchBar } from "@/components/movie/HomeSearchBar";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q || "";
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  return (
    <div className="min-h-screen pb-32 bg-background pt-32">
      <div className="container mx-auto px-4 lg:px-12">
        <div className="flex flex-col gap-12 mb-20 max-w-4xl mx-auto">
          <div className="space-y-4 text-center">
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter italic uppercase leading-none">Tìm kiếm</h1>
            <p className="text-foreground/20 text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed">Khám phá kho tàng điện ảnh chất lượng cao</p>
          </div>

          <HomeSearchBar isXX={false} />
        </div>

        {/* Results Section */}
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-primary/20 animate-spin" />
            <p className="text-foreground/10 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Đang tìm kiếm dữ liệu...</p>
          </div>
        }>
          <SearchResultsClient initialQuery={query} initialPage={currentPage} isXX={false} />
        </Suspense>
      </div>
    </div>
  );
}
