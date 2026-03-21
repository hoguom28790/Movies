import { getYearMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListResponse } from "@/types/movie";
import { notFound } from "next/navigation";

export default async function YearPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let result;
  try {
    result = await getYearMovies(slug, currentPage);
  } catch (error) {
    console.error("Fetch Year Movies Error:", error);
    return notFound();
  }

  if (!result.items.length && currentPage === 1) return notFound();

  return (
    <MovieGrid
      movies={result.items}
      title={`Năm Phát Hành: ${slug}`}
      fetchUrl={`/api/movies?type=year&slug=${slug}`}
      currentPage={result.pagination.currentPage}
      totalPages={result.pagination.totalPages}
    />
  );
}
