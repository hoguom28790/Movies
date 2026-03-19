import Link from "next/link";
import { MovieCard } from "@/components/movie/MovieCard";
import type { Movie } from "@/types/movie";

interface MovieGridProps {
  movies: Movie[];
  title: string;
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function MovieGrid({ movies, title, currentPage, totalPages, basePath }: MovieGridProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <h1 className="text-3xl font-black mb-8 border-l-4 border-primary pl-4">{title}</h1>

      {movies.length === 0 ? (
        <p className="text-neutral-400 text-center py-20">Không tìm thấy phim nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} title={movie.title} slug={movie.slug} posterUrl={movie.posterUrl} year={movie.year} quality={movie.quality} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          {prevPage ? (
            <Link href={`${basePath}?page=${prevPage}`} className="px-5 py-2 bg-surface rounded-lg text-sm font-semibold hover:bg-surface/70 transition-colors">
              ← Trước
            </Link>
          ) : (
            <span className="px-5 py-2 bg-surface/30 rounded-lg text-sm font-semibold text-neutral-500 cursor-not-allowed">← Trước</span>
          )}

          <span className="text-sm text-neutral-400">
            Trang <strong className="text-white">{currentPage}</strong> / {totalPages}
          </span>

          {nextPage ? (
            <Link href={`${basePath}?page=${nextPage}`} className="px-5 py-2 bg-surface rounded-lg text-sm font-semibold hover:bg-surface/70 transition-colors">
              Tiếp →
            </Link>
          ) : (
            <span className="px-5 py-2 bg-surface/30 rounded-lg text-sm font-semibold text-neutral-500 cursor-not-allowed">Tiếp →</span>
          )}
        </div>
      )}
    </div>
  );
}
