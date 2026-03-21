import { getCategoryMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/phim/MovieGrid";

export default async function TVShowsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const { items, pagination } = await getCategoryMovies("tv-shows", currentPage);

  return (
    <MovieGrid
      movies={items}
      title="TV Shows"
      fetchUrl="/api/movies?type=category&category=tv-shows"
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
    />
  );
}
