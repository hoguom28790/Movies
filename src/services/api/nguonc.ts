import { Movie, MovieListResponse } from "@/types/movie";
import { NguonCListResponse } from "@/types/api";

const BASE_URL = "https://phim.nguonc.com/api/films";

export async function getNguonCMovies(page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`${BASE_URL}/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch NguonC");
  const data: NguonCListResponse = await res.json();
  
  const items: Movie[] = data.items.map((item) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.original_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://phim.nguonc.com${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://phim.nguonc.com${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality,
    status: item.status || item.episode_current || "",
    source: 'nguonc' as const
  })).filter((item: Movie) => {
    const s = (item.status || "").toLowerCase();
    const sl = (item.slug || "").toLowerCase();
    const t = (item.title || "").toLowerCase();
    
    return !s.includes("trailer") && 
           !sl.includes("trailer") && 
           !t.includes("trailer") &&
           !s.includes("sắp chiếu") &&
           !s.includes("coming soon") &&
           !s.includes("tập 0");
  });

  return {
    items,
    pagination: {
      currentPage: data.paginate.current_page,
      totalPages: data.paginate.total_page,
      totalItems: data.paginate.total_items
    }
  };
}
