import { Movie, MovieListResponse } from "@/types/movie";
import { KKPhimListResponse, KKPhimSearchResponse } from "@/types/api-providers";

const BASE_URL = "https://phimapi.com/danh-sach";

export async function getKKPhimMovies(page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`${BASE_URL}/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch KKPhim");
  const data: KKPhimListResponse = await res.json();
  const imagePrefix = data.pathImage || "https://phimimg.com/";
  
  const items: Movie[] = (data.items || []).map((item) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}${item.poster_url.replace(/^\//,'')}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}${item.thumb_url.replace(/^\//,'')}`,
    year: item.year?.toString() || "",
    status: item.status || "",
    source: 'kkphim' as const
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
      currentPage: data.pagination?.currentPage || page,
      totalPages: data.pagination?.pageRanges || 1,
      totalItems: data.pagination?.totalItems || 0
    }
  };
}

export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  const res = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to search KKPhim");
  const data: KKPhimSearchResponse = await res.json();
  
  if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

  const imagePrefix = data.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
  const items: Movie[] = (data.data?.items || []).map((item) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}/${item.poster_url.replace(/^\//,'')}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}/${item.thumb_url.replace(/^\//,'')}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.episode_current || "",
    source: 'kkphim' as const
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

  const pg = data.data?.params.pagination || { currentPage: page, totalItems: 0, totalItemsPerPage: 20 };
  return {
    items,
    pagination: {
      currentPage: pg.currentPage,
      totalPages: Math.ceil(pg.totalItems / pg.totalItemsPerPage) || 1,
      totalItems: pg.totalItems
    }
  };
}

