import { getTopXXMovies } from "@/services/api/topxx";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function XXCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const isSpecialType = slug === "phim-moi-cap-nhat" || slug === "phim-le";
    const initialData = isSpecialType 
      ? await getTopXXMovies(slug === "phim-le" ? "phim-le" : "phim-moi", "", 1)
      : await getTopXXMovies("the-loai", slug, 1);
      
    const title = slug === "phim-moi-cap-nhat" 
      ? "PHIM MỚI CẬP NHẬT" 
      : slug === "phim-le" ? "PHIM LẺ" : slug === "phim-bo" ? "PHIM BỘ" : slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
      <div className="container mx-auto">
        <MovieGrid 
          initialMovies={initialData.items} 
          title={`THỂ LOẠI: ${title}`} 
          fetchUrl={`/api/topxx?type=${isSpecialType ? (slug === "phim-le" ? "phim-le" : slug === "phim-bo" ? "phim-bo" : "phim-moi") : "the-loai"}&slug=${slug}`}
          initialPage={1}
          totalPages={initialData.pagination.totalPages}
          isXX
        />
      </div>
    );
  } catch (e) {
    return notFound();
  }
}
