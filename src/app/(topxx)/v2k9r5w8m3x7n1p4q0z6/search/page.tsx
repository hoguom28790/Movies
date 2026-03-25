import { XXMovieCard } from "@/components/movie/XXMovieCard";
import { XXSearchBar } from "@/components/movie/XXSearchBar";
import Link from "next/link";
import { Search } from "lucide-react";
import { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";

// TargetLintErrorIds: [TS2304]
import { searchTopXXMovies } from "@/services/api/topxx";

// TargetLintErrorIds: [TS2304]
interface XXSearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

// TargetLintErrorIds: [TS2304]
interface MovieListResponse {
  items: Movie[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export default async function XXSearchPage({
  searchParams,
}: XXSearchPageProps) {
  // FINAL FIX: [TopXX Search] Next.js 15 searchParams resolution
  const params = await searchParams;
  const q = params.q || "";
  const pageStr = params.page || "1";
  const currentPage = Math.max(1, parseInt(pageStr, 10));

  let results: MovieListResponse = {
    items: [],
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1 }
  };

  if (q) {
    console.log(`[TopXX Search] Query received: "${q}" (Page: ${currentPage})`);
    try {
      const fetchedResults = await searchTopXXMovies(q, currentPage);
      if (fetchedResults && Array.isArray(fetchedResults.items)) {
        results = fetchedResults;
        console.log(`[TopXX Search] Response from API:`, results.items.length, "items");
      }
    } catch (err: any) {
      console.error("[TopXX Search] Error:", err.message);
      // Fallback UI handled by results state
    }
  }

  // Double check items integrity
  const safeItems = results.items || [];
  const safeTotalItems = results.pagination?.totalItems || 0;
  const safeTotalPages = results.pagination?.totalPages || 1;

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white font-headline drop-shadow-2xl">
            TÌM KIẾM <span className="text-yellow-500">TÁC PHẨM</span>
          </h1>
          <p className="text-white/40 font-black uppercase tracking-[0.6em] text-[10px] italic">
            Elite Archive Multi-Source Search
          </p>
        </div>

        <XXSearchBar />
      </div>

      {/* Results Section */}
      <div className="flex flex-col gap-12">
        {q && (
          <div className="flex flex-col gap-2 border-l-4 border-yellow-500 pl-6 py-2">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
              KẾT QUẢ CHO: <span className="text-yellow-500 underline decoration-yellow-500/30 underline-offset-8">"{q}"</span>
            </h2>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">
              TÌM THẤY {results?.pagination?.totalItems || 0} TÁC PHẨM
            </span>
          </div>
        )}

        {safeItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12">
            {safeItems.map((item: any, idx: number) => (
              item && <XXMovieCard key={`${item.id}-${idx}`} {...item} />
            ))}
          </div>
        ) : q ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed space-y-8">
            <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-yellow-500/20" />
            </div>
            <div className="text-center space-y-4">
              <p className="text-white/40 text-sm font-black uppercase tracking-[0.4em] italic text-center px-12">
                Không tìm thấy tác phẩm nào phù hợp với từ khóa <br />
                <span className="text-yellow-500/50">"{q}"</span>
              </p>
              <Link href="/v2k9r5w8m3x7n1p4q0z6" className="inline-block text-yellow-500 hover:text-white font-black uppercase italic tracking-widest text-[12px] underline underline-offset-8">
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <Search className="w-20 h-20 mb-6" />
            <p className="font-black uppercase tracking-[0.5em] text-xs">Nhập từ khóa để bắt đầu tìm kiếm</p>
          </div>
        )}

        {/* Pagination */}
        {safeTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            {currentPage > 1 && (
              <Link
                href={`/v2k9r5w8m3x7n1p4q0z6/search?q=${encodeURIComponent(q)}&page=${currentPage - 1}`}
                className="h-12 px-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300"
              >
                ← TRANG TRƯỚC
              </Link>
            )}
            <div className="h-12 px-8 rounded-full bg-yellow-500 flex items-center justify-center text-[12px] font-black text-black uppercase italic">
              TRANG {currentPage} / {safeTotalPages}
            </div>
            {currentPage < safeTotalPages && (
              <Link
                href={`/v2k9r5w8m3x7n1p4q0z6/search?q=${encodeURIComponent(q)}&page=${currentPage + 1}`}
                className="h-12 px-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300"
              >
                TRANG TIẾP →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
