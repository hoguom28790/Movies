import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://vsmov.com/api";

export async function getVsmovMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error("Failed to fetch Vsmov");
    const data = await res.json();
    
    // Vsmov usually provides full URLs in their API response
    const items: Movie[] = data.items.map((item: any) => ({
      id: item.slug,
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://vsmov.com${item.poster_url.startsWith('/') ? '' : '/'}${item.poster_url}`,
      thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://vsmov.com${item.thumb_url.startsWith('/') ? '' : '/'}${item.thumb_url}`,
      year: item.year?.toString() || "",
      status: item.status || item.episode_current || "",
      tmdbId: item.tmdb?.id || item.tmdb_id || "",
      imdbId: item.imdb?.id || item.imdb_id || "",
      source: 'vsmov'
    })).filter((item: Movie) => 
      item.status?.toLowerCase() !== "trailer" && 
      item.quality?.toLowerCase() !== "trailer"
    );

    return {
      items,
      pagination: {
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems
      }
    };
  } catch (error) {
    console.error("Vsmov API Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error("Failed to search Vsmov");
    const data = await res.json();
    
    if (data.status === false) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = data.items.map((item: any) => ({
      id: item.slug,
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://vsmov.com${item.poster_url.startsWith('/') ? '' : '/'}${item.poster_url}`,
      thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://vsmov.com${item.thumb_url.startsWith('/') ? '' : '/'}${item.thumb_url}`,
      year: item.year?.toString() || "",
      quality: item.quality || "",
      status: item.status || item.episode_current || "",
      tmdbId: item.tmdb?.id || item.tmdb_id || "",
      imdbId: item.imdb?.id || item.imdb_id || "",
      source: 'vsmov'
    })).filter((item: Movie) => 
      item.status?.toLowerCase() !== "trailer" && 
      item.quality?.toLowerCase() !== "trailer"
    );

    const pg = data.pagination;
    return {
      items,
      pagination: {
        currentPage: pg.currentPage,
        totalPages: pg.totalPages,
        totalItems: pg.totalItems
      }
    };
  } catch (error) {
    console.error("Vsmov Search Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}
