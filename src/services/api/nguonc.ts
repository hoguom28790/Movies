import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://phim.nguonc.com/api/films";

export async function getNguonCMovies(page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`${BASE_URL}/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch NguonC");
  const data = await res.json();
  
  const items: Movie[] = data.items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.original_name,
    slug: item.slug,
    posterUrl: item.poster_url,
    thumbUrl: item.thumb_url,
    year: item.year?.toString() || "",
    quality: item.quality,
    status: item.status || item.episode_current || "",
    source: 'nguonc'
  })).filter((item: Movie) => 
    item.status?.toLowerCase() !== "trailer" && 
    item.quality?.toLowerCase() !== "trailer"
  );

  return {
    items,
    pagination: {
      currentPage: data.paginate.current_page,
      totalPages: data.paginate.total_page,
      totalItems: data.paginate.total_items
    }
  };
}
