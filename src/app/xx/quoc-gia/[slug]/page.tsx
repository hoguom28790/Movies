import { getTopXXMovies } from "@/services/api/topxx";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function XXCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const initialData = await getTopXXMovies(1, "quoc-gia", slug);
    const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
      <div className="container mx-auto">
        <XXMovieGrid 
          initialMovies={initialData.items} 
          title={`QUỐC GIA: ${title}`} 
          fetchUrl={`/api/xx?type=quoc-gia&slug=${slug}`}
          initialPage={1}
          totalPages={initialData.pagination.totalPages}
        />
      </div>
    );
  } catch (e) {
    return notFound();
  }
}
