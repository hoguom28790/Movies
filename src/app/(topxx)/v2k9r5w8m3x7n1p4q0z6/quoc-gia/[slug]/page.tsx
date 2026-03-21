import { getTopXXMovies } from "@/services/api/v2k9r5w8m3x7n1p4q0z6";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function XXCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const initialData = await getTopXXMovies(1, "quoc-gia", slug);

    return (
      <div className="container mx-auto">
        <XXMovieGrid 
          initialMovies={initialData.items || []} 
          title={`QUỐC GIA: ${slug.toUpperCase()}`} 
          fetchUrl={`/api/topxx?type=quoc-gia&slug=${slug}`}
          initialPage={1}
          totalPages={initialData.pagination?.totalPages || 1}
        />
      </div>
    );
  } catch (e) {
    return notFound();
  }
}
