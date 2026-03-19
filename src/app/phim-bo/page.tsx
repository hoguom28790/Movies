import { getCategoryMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/movie/MovieGrid";

export default async function PhimBoPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const { items, pagination } = await getCategoryMovies("phim-bo", currentPage);

  return (
    <MovieGrid
      movies={items}
      title="Phim Bộ"
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      basePath="/phim-bo"
    />
  );
}
