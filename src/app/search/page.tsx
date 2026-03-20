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
    <div className="container mx-auto px-4 lg:px-12 py-8 mt-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Search Header */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <Search className="w-8 h-8 text-primary" />
            Tìm Kiếm
          </h1>

          <Form action="/search" className="relative group">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Nhập tên phim, diễn viên, đạo diễn..."
              autoFocus
              className="w-full h-14 md:h-16 rounded-full bg-white/5 border border-white/10 px-8 pr-16 text-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-8 rounded-full bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[13px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30"
            >
              Tìm
            </button>
          </Form>

          {/* Filters Placeholder */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] font-black uppercase tracking-wider text-white/40 hover:text-white hover:bg-primary hover:border-primary transition-all">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
            {["Phim lẻ", "Phim bộ", "Hoạt hình", "Năm 2024", "Năm 2023"].map((tag) => (
              <button
                key={tag}
                className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[13px] font-black uppercase tracking-wider text-white/40 hover:text-white hover:bg-primary hover:border-primary transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col gap-8">
          {query && (
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white/80">
                Kết quả cho: <span className="text-primary">"{query}"</span>
              </h2>
              <span className="text-sm font-semibold text-white/40">
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
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-10 h-10 text-white/20" />
              </div>
              <p className="text-lg text-white/40 font-medium">
                Không tìm thấy phim nào phù hợp với từ khóa <br />
                <span className="text-white/60">"{query}"</span>
              </p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-white/40 font-medium">Hãy nhập tên phim để bắt đầu tìm kiếm.</p>
            </div>
          )}

          {/* Pagination */}
          {results.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/search?q=${query}&page=${currentPage - 1}`}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  ← Trang trước
                </Link>
              )}
              <span className="text-sm font-bold text-white/40">
                Trang <span className="text-white">{currentPage}</span> /{" "}
                {results.pagination.totalPages}
              </span>
              {currentPage < results.pagination.totalPages && (
                <Link
                  href={`/search?q=${query}&page=${currentPage + 1}`}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Trang tiếp →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

