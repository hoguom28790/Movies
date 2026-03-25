import { searchTopXXMovies } from "@/services/api/topxx";
import { XXMovieCard } from "@/components/movie/XXMovieCard";
import { XXSearchBar } from "@/components/movie/XXSearchBar";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function XXSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q || "";
  const parsedPage = parseInt(page || "1", 10);
  const currentPage = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  let results: Awaited<ReturnType<typeof searchTopXXMovies>> = { 
    items: [], 
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } 
  };

  if (query) {
    try {
      results = await searchTopXXMovies(query, currentPage);
    } catch (err) {
      console.error("Search Page Execution Error:", err);
      // Fallback stays as default let results
    }
  }

  return (
    <div className="container mx-auto px-4 lg:px-12 py-16 mt-16 min-h-screen max-w-7xl">
      <div className="flex flex-col gap-16">
        {/* Search Header Area */}
        <div className="flex flex-col gap-8">
           <div className="flex flex-col gap-2">
              <div className="h-1 w-12 bg-yellow-500 rounded-full animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none flex items-center gap-4">
                <Search className="w-10 h-10 text-yellow-500" />
                TÌM KIẾM
              </h1>
           </div>
           
           <XXSearchBar />
        </div>

        {/* Results Section */}
        <div className="flex flex-col gap-12">
          {query && (
            <div className="flex flex-col gap-2 border-l-4 border-yellow-500 pl-6 py-2">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                KẾT QUẢ CHO: <span className="text-yellow-500 underline decoration-yellow-500/30 underline-offset-8">"{query}"</span>
              </h2>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">
                TÌM THẤY {results?.pagination?.totalItems || 0} TÁC PHẨM
              </span>
            </div>
          )}

          {(results?.items?.length || 0) > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {results.items.map((movie, idx) => (
                movie && (
                  <XXMovieCard
                    key={`${movie.id}-${idx}`}
                    title={movie.title}
                    slug={movie.slug}
                    posterUrl={movie.thumbUrl || movie.posterUrl}
                    year={movie.year}
                    quality={movie.quality}
                  />
                )
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
               <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                 <Search className="w-10 h-10 text-yellow-500/20" />
               </div>
               <p className="text-white/40 text-sm font-black uppercase tracking-[0.4em] italic text-center px-12">
                 Không tìm thấy tác phẩm nào phù hợp với từ khóa <br />
                 <span className="text-yellow-500/50">"{query}"</span>
               </p>
            </div>
          ) : (
            <div className="py-32 bg-white/[0.02] border border-white/5 rounded-[40px] text-center">
              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.8em] italic">Hãy nhập tên tác phẩm hoặc diễn viên để bắt đầu</p>
            </div>
          )}

          {/* Pagination */}
          {(results?.pagination?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              {currentPage > 1 && (
                <Link
                  href={`/v2k9r5w8m3x7n1p4q0z6/search?q=${query}&page=${currentPage - 1}`}
                  className="h-12 px-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300"
                >
                   ← TRANG TRƯỚC
                </Link>
              )}
              <div className="h-12 px-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-[11px] font-black text-yellow-500">
                {currentPage} / {results?.pagination?.totalPages || 1}
              </div>
              {currentPage < (results?.pagination?.totalPages || 0) && (
                <Link
                  href={`/v2k9r5w8m3x7n1p4q0z6/search?q=${query}&page=${currentPage + 1}`}
                  className="h-12 px-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300"
                >
                   TRANG TIẾP →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
