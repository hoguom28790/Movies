import { getTopXXMovies } from "@/services/api/topxx";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";

export const dynamic = "force-dynamic";

export default async function XXActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Format slug 'nguyen-van-a' back to 'Nguyen Van A' for display
  const actorName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const initialData = await getTopXXMovies(1, "dien-vien", slug);

  return (
    <div className="container mx-auto">
      <XXMovieGrid 
        initialMovies={initialData.items || []} 
        title={`DIỄN VIÊN: ${actorName}`} 
        fetchUrl={`/api/xx?type=dien-vien&slug=${slug}`}
        initialPage={1}
        totalPages={initialData.pagination?.totalPages || 1}
      />
    </div>
  );
}
