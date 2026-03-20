import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://phimapi.com/danh-sach";

export async function getKKPhimMovies(page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`${BASE_URL}/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch KKPhim");
  const data = await res.json();
  
  const items: Movie[] = data.items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://phimimg.com/${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://phimimg.com/${item.thumb_url}`,
    year: item.year?.toString() || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: 'kkphim'
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
}

export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
    cache: "no-store",
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to search KKPhim");
  const data = await res.json();
  
  if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

  const items: Movie[] = data.data.items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: `https://phimimg.com/${item.poster_url}`,
    thumbUrl: `https://phimimg.com/${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: 'kkphim'
  })).filter((item: Movie) => 
    item.status?.toLowerCase() !== "trailer" && 
    item.quality?.toLowerCase() !== "trailer"
  );

  const pg = data.data.params.pagination;
  return {
    items,
    pagination: {
      currentPage: pg.currentPage,
      totalPages: Math.ceil(pg.totalItems / pg.totalItemsPerPage),
      totalItems: pg.totalItems
    }
  };
}
