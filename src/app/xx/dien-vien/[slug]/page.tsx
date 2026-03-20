import { getTopXXMovies } from "@/services/api/topxx";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function XXActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initialData = await getTopXXMovies(1, "dien-vien", slug);

  if (!initialData.items || initialData.items.length === 0) {
    // Return empty results instead of 404 to allow empty actress pages to be seen
    // or just use notFound if appropriate. But standard behavior is showing empty results.
  }

  return (
    <div className="container mx-auto">
      <XXMovieGrid 
        initialMovies={initialData.items || []} 
        title={`DIỄN VIÊN MÃ: ${slug.toUpperCase()}`} 
        fetchUrl={`/api/xx?type=dien-vien&slug=${slug}`}
        initialPage={1}
        totalPages={initialData.pagination?.totalPages || 1}
      />
    </div>
  );
}
