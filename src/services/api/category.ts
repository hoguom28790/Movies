import type { Movie, MovieListResponse } from "@/types/movie";

const OPHIM = "https://ophim1.com/v1/api";
const KKPHIM = "https://phimapi.com/v1/api";

function normalizeOphim(items: any[], cdnBase: string): Movie[] {
  const base = cdnBase.replace(/\/$/, "") + "/uploads/movies/";
  return items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith("http") ? item.poster_url : `${base}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith("http") ? item.thumb_url : `${base}${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: "ophim" as const,
  }));
}

function normalizeKk(items: any[]): Movie[] {
  const base = "https://phimimg.com/";
  return items.map((item: any) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith("http") ? item.poster_url : `${base}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith("http") ? item.thumb_url : `${base}${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.status || item.episode_current || "",
    tmdbId: item.tmdb?.id || item.tmdb_id || "",
    imdbId: item.imdb?.id || item.imdb_id || "",
    source: "kkphim" as const,
  }));
}

/** Fetch movies for a list-type endpoint: phim-le, phim-bo, hoat-hinh, tv-shows, etc. */
export async function getCategoryMovies(type: string, page = 1): Promise<MovieListResponse> {
  // Map some shorthand slugs to OPhim/KKPhim expected slugs
  const typeMap: Record<string, string> = {
    "chieu-rap": "phim-chieu-rap",
    "long-tieng": "phim-long-tieng",
    "thuyet-minh": "phim-thuyet-minh",
    "movies": "phim-le",
    "series": "phim-bo",
    "anime": "hoat-hinh",
  };

  const actualType = typeMap[type] || type;

  // Priority 1: OPhim
  try {
    const res = await fetch(`${OPHIM}/danh-sach/${actualType}?page=${page}`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.items?.length) {
      const pg = data.data.params?.pagination;
      return {
        items: normalizeOphim(data.data.items, data.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/").filter((item: Movie) => 
          item.status?.toLowerCase() !== "trailer" && 
          item.quality?.toLowerCase() !== "trailer"
        ),
        pagination: { currentPage: pg?.currentPage || page, totalPages: Math.ceil((pg?.totalItems || 1000) / (pg?.totalItemsPerPage || 24)), totalItems: pg?.totalItems || 1000 },
      };
    }
  } catch { /* fall through */ }

  // Priority 2: KKPhim
  const res2 = await fetch(`${KKPHIM}/danh-sach/${actualType}?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  const data2 = await res2.json();
  const pg2 = data2.data?.params?.pagination;
  return {
    items: normalizeKk(data2.data?.items || []).filter((item: Movie) => 
      item.status?.toLowerCase() !== "trailer" && 
      item.quality?.toLowerCase() !== "trailer"
    ),
    pagination: { currentPage: pg2?.currentPage || page, totalPages: Math.ceil((pg2?.totalItems || 1000) / (pg2?.totalItemsPerPage || 10)), totalItems: pg2?.totalItems || 1000 },
  };
}

/** Fetch movies by genre slug */
export async function getGenreMovies(genre: string, page = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${OPHIM}/the-loai/${genre}?page=${page}`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.items?.length) {
      const pg = data.data.params?.pagination;
      return {
        items: normalizeOphim(data.data.items, data.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/").filter((item: Movie) => 
          item.status?.toLowerCase() !== "trailer" && 
          item.quality?.toLowerCase() !== "trailer"
        ),
        pagination: { currentPage: pg?.currentPage || page, totalPages: Math.ceil((pg?.totalItems || 1000) / (pg?.totalItemsPerPage || 24)), totalItems: pg?.totalItems || 1000 },
      };
    }
  } catch { /* fall through */ }

  const res2 = await fetch(`${KKPHIM}/the-loai/${genre}?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  const data2 = await res2.json();
  const pg2 = data2.data?.params?.pagination;
  return {
    items: normalizeKk(data2.data?.items || []),
    pagination: { currentPage: pg2?.currentPage || page, totalPages: Math.ceil((pg2?.totalItems || 1000) / (pg2?.totalItemsPerPage || 10)), totalItems: pg2?.totalItems || 1000 },
  };
}

/** Fetch movies by country slug */
export async function getCountryMovies(country: string, page = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${OPHIM}/quoc-gia/${country}?page=${page}`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.items?.length) {
      const pg = data.data.params?.pagination;
      return {
        items: normalizeOphim(data.data.items, data.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/"),
        pagination: { currentPage: pg?.currentPage || page, totalPages: Math.ceil((pg?.totalItems || 1000) / (pg?.totalItemsPerPage || 24)), totalItems: pg?.totalItems || 1000 },
      };
    }
  } catch { /* fall through */ }

  const res2 = await fetch(`${KKPHIM}/quoc-gia/${country}?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  const data2 = await res2.json();
  const pg2 = data2.data?.params?.pagination;
  return {
    items: normalizeKk(data2.data?.items || []),
    pagination: { currentPage: pg2?.currentPage || page, totalPages: Math.ceil((pg2?.totalItems || 1000) / (pg2?.totalItemsPerPage || 10)), totalItems: pg2?.totalItems || 1000 },
  };
}

/** Fetch movies by year */
export async function getYearMovies(year: string, page = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${OPHIM}/nam-phat-hanh/${year}?page=${page}`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.items?.length) {
      const pg = data.data.params?.pagination;
      return {
        items: normalizeOphim(data.data.items, data.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/"),
        pagination: { currentPage: pg?.currentPage || page, totalPages: Math.ceil((pg?.totalItems || 1000) / (pg?.totalItemsPerPage || 24)), totalItems: pg?.totalItems || 1000 },
      };
    }
  } catch { /* fall through */ }

  const res2 = await fetch(`${KKPHIM}/nam-phat-hanh/${year}?page=${page}`, { 
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000)
  });
  const data2 = await res2.json();
  const pg2 = data2.data?.params?.pagination;
  return {
    items: normalizeKk(data2.data?.items || []),
    pagination: { currentPage: pg2?.currentPage || page, totalPages: Math.ceil((pg2?.totalItems || 1000) / (pg2?.totalItemsPerPage || 10)), totalItems: pg2?.totalItems || 1000 },
  };
}

/** Fetch list of all genres */
export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const res = await fetch(`${OPHIM}/the-loai`, { 
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.items) {
      return data.data.items.map((g: any) => ({ name: g.name, slug: g.slug }));
    }
  } catch { /* fall through */ }

  const res2 = await fetch(`${KKPHIM}/the-loai`, { 
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(5000)
  });
  const data2 = await res2.json();
  return (data2.data?.items || []).map((g: any) => ({ name: g.name, slug: g.slug }));
}
