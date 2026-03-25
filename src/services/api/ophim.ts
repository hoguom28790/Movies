import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://ophim1.com/danh-sach";

export async function getOPhimMovies(page: number = 1, baseUrl: string = "https://ophim1.com"): Promise<MovieListResponse> {
  const res = await fetch(`${baseUrl}/danh-sach/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch OPhim");
  const data = await res.json();
  
  const imagePrefix = data.pathImage || "https://img.ophim1.com/uploads/movies/";

  const items: Movie[] = data.items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}${item.thumb_url}`,
    year: item.year?.toString() || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: 'ophim'
  })).filter((item: Movie) => 
    item.status?.toLowerCase() !== "trailer" && 
    item.quality?.toLowerCase() !== "trailer"
  );

  return {
    items,
    pagination: {
      currentPage: data.pagination?.currentPage || page,
      totalPages: data.pagination?.totalPages || 100,
      totalItems: data.pagination?.totalItems || 1000
    }
  };
}

export async function searchMovies(keyword: string, page: number = 1, baseUrl: string = "https://ophim1.com"): Promise<MovieListResponse> {
  const res = await fetch(`${baseUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
    cache: "no-store",
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to search OPhim");
  const data = await res.json();
  
  if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

  const imagePrefix = data.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim1.com/uploads/movies/";
  const items: Movie[] = data.data.items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: 'ophim'
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
