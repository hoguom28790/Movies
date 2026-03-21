import { getCategoryMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/phim/MovieGrid";

export default async function HoatHinhPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const { items, pagination } = await getCategoryMovies("hoat-hinh", currentPage);

  return (
    <MovieGrid
      movies={items}
      title="Hoạt Hình"
      fetchUrl="/api/movies?type=category&category=hoat-hinh"
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
    />
  );
}
