import { Movie, MovieListResponse } from "@/types/movie";
import { getAVDBMovies } from "./avdb";

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
    const actorName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const results = await searchTopXXMovies(actorName, page);
    if (results.items.length === 0) {
      return getAVDBMovies(page, undefined, undefined, actorName);
    }
    return results;
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
        source: 'topxx',
        overview: viTrans?.description || item.description || enTrans?.description || ""
      };
    });

    return {
      items,
      pagination: {
        currentPage: data.meta?.current_page || 1,
        totalPages: data.meta?.last_page || 1,
        totalItems: data.meta?.total || items.length
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

  const url = `${BASE_URL}/movies/search?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  
  try {
    const [topxxRes, avdbTitleRes, avdbActorRes] = await Promise.allSettled([
      fetch(url, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(10000) })
        .then(async r => {
          if (!r.ok) return null;
          try { return await r.json(); } catch(e) { return null; }
        }),
      getAVDBMovies(page, undefined, keyword),
      getAVDBMovies(page, undefined, undefined, keyword)
    ]);

    let items: Movie[] = [];
    let totalItems = 0;
    let totalPages = 1;

    // 1. Process TopXX results
    if (topxxRes.status === "fulfilled" && topxxRes.value?.status === "success" && Array.isArray(topxxRes.value.data)) {
      const txItems = topxxRes.value.data.map((item: any) => {
        if (!item || !item.code) return null;
        const viTrans = Array.isArray(item.trans) ? (item.trans.find((t: any) => t.locale === "vi") || item.trans[0]) : null;
        const enTrans = Array.isArray(item.trans) ? (item.trans.find((t: any) => t.locale === "en") || {}) : {};
        return {
          id: item.code,
          title: viTrans?.title || item.title || "No Title",
          originalTitle: enTrans?.title || "",
          slug: item.code,
          posterUrl: item.thumbnail || "",
          thumbUrl: item.thumbnail || "",
          year: item.publish_at ? new Date(item.publish_at).getFullYear().toString() : "",
          status: item.quality || "",
          quality: item.quality || "HD",
          source: 'topxx' as const,
          overview: viTrans?.description || item.description || enTrans?.description || ""
        };
      }).filter(Boolean) as Movie[];
      
      items = [...items, ...txItems];
      totalItems += topxxRes.value.meta?.total || txItems.length;
      totalPages = Math.max(totalPages, topxxRes.value.meta?.last_page || 1);
    }

    // 2. Process AVDB title results
    if (avdbTitleRes.status === "fulfilled" && avdbTitleRes.value?.items) {
        items = [...items, ...avdbTitleRes.value.items];
        totalItems += avdbTitleRes.value.pagination.totalItems || 0;
        totalPages = Math.max(totalPages, avdbTitleRes.value.pagination.totalPages || 1);
    }

    // 3. Process AVDB actor results
    if (avdbActorRes.status === "fulfilled" && avdbActorRes.value?.items) {
        items = [...items, ...avdbActorRes.value.items];
        totalItems += avdbActorRes.value.pagination.totalItems || 0;
        totalPages = Math.max(totalPages, avdbActorRes.value.pagination.totalPages || 1);
    }

    // Dedup results by ID
    const seen = new Set();
    items = items.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });

    return {
      items,
      pagination: {
        totalItems: Math.max(items.length, totalItems),
        totalPages: Math.max(1, totalPages),
        currentPage: page
      }
    };
  } catch (error) {
    console.error("Search API Logic Error:", error);
    return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
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
