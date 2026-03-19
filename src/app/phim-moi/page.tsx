import { getLatestMovies } from "@/services/api";
import { MovieGrid } from "@/components/movie/MovieGrid";

export default async function PhimMoiPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  
  const { items, pagination } = await getLatestMovies(currentPage);

  return (
    <MovieGrid
      movies={items}
      title="Phim Mới Cập Nhật"
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      basePath="/phim-moi"
    />
  );
}
