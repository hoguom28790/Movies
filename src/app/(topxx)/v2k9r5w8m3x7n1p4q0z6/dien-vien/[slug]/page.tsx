import { getTopXXMovies } from "@/services/api/topxx";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { ActorProfile } from "@/components/movie/ActorProfile";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopXXActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Format slug 'nguyen-van-a' back to 'Nguyen Van A' for display
  const actorName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  try {
    const initialData = await getTopXXMovies("dien-vien", slug, 1);

    return (
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl animate-in fade-in duration-1000">
        <ActorProfile actorName={actorName} slug={slug} isXX={true} />
        
        <MovieGrid 
          initialMovies={initialData.items || []} 
          title={`FILMOGRAPHY: ${actorName.toUpperCase()}`} 
          fetchUrl={`/api/topxx?type=dien-vien&slug=${slug}`}
          initialPage={1}
          totalPages={initialData.pagination?.totalPages || 1}
          isXX={true}
        />
      </div>
    );
  } catch (e) {
    return notFound();
  }
}
