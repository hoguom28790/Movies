import { getCategoryMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListResponse } from "@/types/movie";
 
export default async function PhimBoPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
 
  let data: MovieListResponse = { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  try {
    data = await getCategoryMovies("phim-bo", currentPage);
  } catch (err) {
    console.error("PhimBoPage Error:", err);
  }
 
  return (
    <MovieGrid
      movies={data.items}
      title="Phim Bộ"
      fetchUrl="/api/movies?type=category&category=phim-bo"
      currentPage={data.pagination.currentPage}
      totalPages={data.pagination.totalPages}
    />
  );
}
