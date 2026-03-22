import { searchMovies } from "@/services/api";
import { MovieCard } from "@/components/movie/MovieCard";
import Form from "next/form";
import Link from "next/link";
import { Search, Filter } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q || "";
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let results: Awaited<ReturnType<typeof searchMovies>> = { 
    items: [], 
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } 
  };

  if (query) {
    results = await searchMovies(query, currentPage);
  }

  return (
    <div className="container mx-auto px-4 lg:px-12 py-8 mt-16 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Search Header */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground/90 flex items-center gap-2">
            <Search className="w-5 h-5 text-foreground/40" />
            Tìm Kiếm
          </h1>

          <Form action="/search" className="relative group">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Tên phim, diễn viên..."
              className="w-full h-12 rounded-xl bg-foreground/5 border border-foreground/10 px-4 pr-16 text-[15px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-foreground/[0.08] transition-all placeholder:text-foreground/20"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-[12px] font-bold transition-all"
            >
              Tìm
            </button>
          </Form>

          {/* Filters (Simplified for Mobile) */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 text-[11px] sm:text-[12px] text-foreground/40">
              <Filter className="w-3 h-3" />
              Bộ lọc
            </button>
            {["Phim lẻ", "Phim bộ", "Năm 2024"].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 text-[11px] sm:text-[12px] text-foreground/30 hover:text-foreground transition-colors"
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col gap-8">
          {query && (
            <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
              <h2 className="text-xl font-bold text-foreground/80">
                Kết quả cho: <span className="text-primary">"{query}"</span>
              </h2>
              <span className="text-sm font-semibold text-foreground/40">
                Tìm thấy {results.pagination.totalItems} kết quả
              </span>
            </div>
          )}

          {results.items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
              {results.items.map((movie, idx) => (
                <MovieCard
                  key={`${movie.id}-${idx}`}
                  title={movie.title}
                  slug={movie.slug}
                  posterUrl={movie.thumbUrl || movie.posterUrl}
                  year={movie.year}
                  quality={movie.quality}
                />
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center">
                <Search className="w-10 h-10 text-foreground/20" />
              </div>
              <p className="text-lg text-foreground/40 font-medium">
                Không tìm thấy phim nào phù hợp với từ khóa <br />
                <span className="text-foreground/60">"{query}"</span>
              </p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-foreground/40 font-medium">Hãy nhập tên phim để bắt đầu tìm kiếm.</p>
            </div>
          )}

          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/search?q=${query}&page=${currentPage - 1}`}
                  className="px-4 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm font-bold text-foreground/60 hover:text-foreground transition-all"
                >
                  <span className="md:hidden">←</span>
                  <span className="hidden md:inline">← Trang trước</span>
                </Link>
              )}
              <div className="px-3 py-2 rounded-lg bg-foreground/5 text-[13px] font-bold text-foreground/40">
                <span className="text-foreground">{currentPage}</span> / {results.pagination.totalPages}
              </div>
              {currentPage < results.pagination.totalPages && (
                <Link
                  href={`/search?q=${query}&page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm font-bold text-foreground/60 hover:text-foreground transition-all"
                >
                  <span className="md:hidden">→</span>
                  <span className="hidden md:inline">Trang tiếp →</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

