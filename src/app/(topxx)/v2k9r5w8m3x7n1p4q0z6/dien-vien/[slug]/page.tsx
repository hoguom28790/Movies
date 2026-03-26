import { getTopXXMovies } from "@/services/api/topxx";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";
import { XXActorProfile } from "@/components/movie/XXActorProfile";

export const dynamic = "force-dynamic";

export default async function XXActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Format slug 'nguyen-van-a' back to 'Nguyen Van A' for display
  const actorName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const initialData = await getTopXXMovies("dien-vien", slug, 1);

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl animate-in fade-in duration-1000">
      <XXActorProfile actorName={actorName} slug={slug} />
      
      <XXMovieGrid 
        initialMovies={initialData.items || []} 
        title={`FILMOGRAPHY OF ${actorName}`} 
        fetchUrl={`/api/topxx?type=dien-vien&slug=${slug}`}
        initialPage={1}
        totalPages={initialData.pagination?.totalPages || 1}
      />
    </div>
  );
}
