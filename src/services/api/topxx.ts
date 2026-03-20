import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://topxx.vip/api/v1";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://topxx.vip/'
};

export async function getTopXXMovies(
  page: number = 1, 
  type: "danh-sach" | "the-loai" | "quoc-gia" | "dien-vien" = "danh-sach", 
  slug: string = "phim-moi-cap-nhat"
): Promise<MovieListResponse> {
  let url = `${BASE_URL}/movies/latest?page=${page}`;
  
  if (type === "the-loai") {
    url = `${BASE_URL}/genres/${slug}/movies?page=${page}`;
  } else if (type === "quoc-gia") {
    url = `${BASE_URL}/countries/${slug}/movies?page=${page}`;
  } else if (type === "dien-vien") {
    const actorName = slug.replace(/-/g, ' ');
    return searchTopXXMovies(actorName, page);
  }

  try {
    const res = await fetch(url, { 
      next: { revalidate: 3600 },
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    const data = await res.json();
    
    if (data.status !== "success" || !data.data) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = data.data.map((item: any) => {
      const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
      const enTrans = item.trans?.find((t: any) => t.locale === "en") || {};
      
      return {
        id: item.code,
        title: viTrans?.title || "No Title",
        originalTitle: enTrans?.title || "",
        slug: item.code, 
        posterUrl: item.thumbnail || "",
        thumbUrl: item.thumbnail || "",
        year: item.publish_at ? new Date(item.publish_at).getFullYear().toString() : "",
        status: item.quality || "",
        quality: item.quality || "HD",
        source: 'topxx'
      };
    });

    const meta = data.meta;
    return {
      items,
      pagination: {
        currentPage: meta.current_page,
        totalPages: meta.last_page,
        totalItems: meta.total
      }
    };
  } catch (error) {
    console.error("TopXX Fetch Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function searchTopXXMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  if (!keyword || keyword.trim().length === 0) {
     return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }

  try {
    // API Documentation: using /movies with keyword parameter might be more accurate for search
    // than /movies/latest (which might ignore filters)
    const url = `${BASE_URL}/movies?keyword=${encodeURIComponent(keyword)}&page=${page}`;
    
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    const data = await res.json();
    if (data.status !== "success" || !data.data) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items = data.data.map((item: any) => {
      const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
      return {
        id: item.code,
        title: viTrans?.title || "No Title",
        slug: item.code,
        posterUrl: item.thumbnail || "",
        thumbUrl: item.thumbnail || "",
        quality: item.quality || "HD",
        source: 'topxx'
      };
    });

    return {
      items,
      pagination: {
        currentPage: data.meta.current_page,
        totalPages: data.meta.last_page,
        totalItems: data.meta.total
      }
    };
  } catch (error) {
    console.error("TopXX Search Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(code: string) {
  try {
    const res = await fetch(`${BASE_URL}/movies/${code}`, { 
      cache: "no-store",
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error("TopXX Detail Error:", error);
    return null;
  }
}
