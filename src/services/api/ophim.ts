import { Movie, MovieListResponse } from "@/types/movie";
import { OPhimListResponse, OPhimSearchResponse } from "@/types/api-providers";

export async function getOPhimMovies(page: number = 1, baseUrl: string = "https://ophim1.com"): Promise<MovieListResponse> {
  const res = await fetch(`${baseUrl}/danh-sach/phim-moi-cap-nhat?page=${page}`, { 
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to fetch OPhim");
  const data: OPhimListResponse = await res.json();
  
  let imagePrefix = data.pathImage || "https://img.ophim1.com/uploads/movies/";
  if (!imagePrefix.includes('/uploads/movies')) {
    imagePrefix = imagePrefix.replace(/\/$/, '') + '/uploads/movies/';
  }
  if (imagePrefix && !imagePrefix.endsWith('/')) imagePrefix += '/';

  const items: Movie[] = (data.items || []).map((item) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}${item.thumb_url}`,
    year: item.year?.toString() || "",
    status: item.episode_current || "",
    source: 'ophim' as const
  })).filter((item: Movie) => {
    const s = item.status?.toLowerCase() || "";
    const sl = item.slug?.toLowerCase() || "";
    const t = item.title?.toLowerCase() || "";
    
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
      totalPages: data.pagination?.totalPages || 100,
      totalItems: data.pagination?.totalItems || 1000
    }
  };
}

export async function searchMovies(keyword: string, page: number = 1, baseUrl: string = "https://ophim1.com"): Promise<MovieListResponse> {
  const res = await fetch(`${baseUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error("Failed to search OPhim");
  const data: OPhimSearchResponse = await res.json();
  
  if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

  let imagePrefix = data.data?.APP_DOMAIN_CDN_IMAGE || data.pathImage || "https://img.ophim1.com";
  if (!imagePrefix.includes('/uploads/movies')) {
    imagePrefix = imagePrefix.replace(/\/$/, '') + '/uploads/movies/';
  }
  if (imagePrefix && !imagePrefix.endsWith('/')) imagePrefix += '/';
  
  const items: Movie[] = (data.data?.items || []).map((item) => ({
    id: item.slug,
    title: item.name,
    originalTitle: item.origin_name,
    slug: item.slug,
    posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `${imagePrefix}${item.poster_url}`,
    thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `${imagePrefix}${item.thumb_url}`,
    year: item.year?.toString() || "",
    quality: item.quality || "",
    status: item.episode_current || "",
    source: 'ophim' as const
  })).filter((item: Movie) => {
    const s = item.status?.toLowerCase() || "";
    const sl = item.slug?.toLowerCase() || "";
    const t = item.title?.toLowerCase() || "";
    return !s.includes("trailer") && !sl.includes("trailer") && !t.includes("trailer");
  });

  const pg = data.data?.params.pagination;
  return {
    items,
    pagination: {
      currentPage: pg?.currentPage || 1,
      totalPages: pg ? Math.ceil(pg.totalItems / pg.totalItemsPerPage) : 1,
      totalItems: pg?.totalItems || 0
    }
  };
}

