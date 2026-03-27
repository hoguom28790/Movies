import { getTopXXMovies } from "@/services/api/topxx";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopXXCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const initialData = await getTopXXMovies("quoc-gia", slug, 1);

    return (
      <div className="container mx-auto">
        <MovieGrid 
          initialMovies={initialData.items || []} 
          title={`QUỐC GIA: ${slug.toUpperCase()}`} 
          fetchUrl={`/api/topxx?type=quoc-gia&slug=${slug}`}
          isXX={true}
          initialPage={1}
          totalPages={initialData.pagination?.totalPages || 1}
        />
      </div>
    );
  } catch (e) {
    return notFound();
  }
}

