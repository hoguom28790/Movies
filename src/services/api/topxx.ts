import { Movie, MovieListResponse } from "@/types/movie";
import { getAVDBMovies } from "./avdb";

const BASE_URL = "https://topxx.vip/api/v1";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://topxx.vip/'
};

// Helper for timeout-safe fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

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
    const res = await fetchWithTimeout(url, { 
      next: { revalidate: 3600 },
      headers: DEFAULT_HEADERS
    }, 10000);
    
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

// Helper for retry logic
async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = 10000, retries = 2, delay = 800) {
  let lastError: Error | null = null;
  for (let i = 0; i < retries + 1; i++) {
    try {
      if (i > 0) {
        console.log(`[TopXX Search] Retrying (${i}/${retries}) for: ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return await fetchWithTimeout(url, options, timeout);
    } catch (err: any) {
      lastError = err;
      console.error(`[TopXX Search] Attempt ${i + 1} failed:`, err.message);
    }
  }
  throw lastError || new Error("All fetch attempts failed");
}

export async function searchTopXXMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  // FINAL FIX: [TopXX Search] Query normalization
  const normalizedQuery = (keyword || "").trim().toLowerCase();
  
  if (!normalizedQuery) {
    console.log("[TopXX Search] Query received: (Empty)");
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }

  console.log(`[TopXX Search] Query received: "${normalizedQuery}" (Page: ${page})`);
  
  // FINAL FIX: Strict encoded query for topxx.vip
  const topxxUrl = `${BASE_URL}/movies/search?keyword=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  
  try {
    const [topxxRes, avdbTitleRes, avdbActorRes] = await Promise.allSettled([
      fetchWithRetry(topxxUrl, { headers: DEFAULT_HEADERS }, 10000, 2, 800)
        .then(async r => {
          if (!r.ok) {
            console.error(`[TopXX Search] Error: ${r.status} ${r.statusText}`);
            return null;
          }
          try { 
            const json = await r.json(); 
            // FINAL FIX: [TopXX Search] Response logging
            console.log(`[TopXX Search] Response from API:`, json?.data?.length || 0, "items");
            return json;
          } catch(e: any) { 
            console.error("[TopXX Search] Error:", e.message);
            return null; 
          }
        }),
      getAVDBMovies(page, undefined, normalizedQuery).catch(err => {
        console.error("[TopXX Search] Error:", err.message);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      }),
      getAVDBMovies(page, undefined, undefined, normalizedQuery).catch(err => {
        console.error("[TopXX Search] Error:", err.message);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      })
    ]);

    let items: Movie[] = [];
    let totalItemsValue = 0;
    let totalPagesValue = 1;

    // 1. Process TopXX results
    if (topxxRes.status === "fulfilled" && topxxRes.value && topxxRes.value.status === "success" && Array.isArray(topxxRes.value.data)) {
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
      totalItemsValue += topxxRes.value.meta?.total || txItems.length;
      totalPagesValue = Math.max(totalPagesValue, topxxRes.value.meta?.last_page || 1);
    }

    // 2. Process AVDB title results
    if (avdbTitleRes.status === "fulfilled" && avdbTitleRes.value && Array.isArray(avdbTitleRes.value.items)) {
        console.log(`[TopXX Search] Response from avdb (title): ${avdbTitleRes.value.items.length} items`);
        items = [...items, ...avdbTitleRes.value.items];
        totalItemsValue += avdbTitleRes.value.pagination?.totalItems || 0;
        totalPagesValue = Math.max(totalPagesValue, avdbTitleRes.value.pagination?.totalPages || 1);
    }

    // 3. Process AVDB actor results
    if (avdbActorRes.status === "fulfilled" && avdbActorRes.value && Array.isArray(avdbActorRes.value.items)) {
        console.log(`[TopXX Search] Response from avdb (actor): ${avdbActorRes.value.items.length} items`);
        items = [...items, ...avdbActorRes.value.items];
        totalItemsValue += avdbActorRes.value.pagination?.totalItems || 0;
        totalPagesValue = Math.max(totalPagesValue, avdbActorRes.value.pagination?.totalPages || 1);
    }

    // FINAL FIX: Dedup results by ID with strict null check
    const seen = new Set();
    const finalItems = items.filter(item => {
      if (!item || !item.id) return false;
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });

    return {
      items: finalItems,
      pagination: {
        totalItems: Math.max(finalItems.length, totalItemsValue),
        totalPages: Math.max(1, totalPagesValue),
        currentPage: page
      }
    };
  } catch (error) {
    console.error("[TopXX Search] Fatal Logic Error:", error);
    return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
  }
}

export async function getTopXXDetails(code: string) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/movies/${code}`, { 
      cache: "no-store",
      headers: DEFAULT_HEADERS
    }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    console.error("[TopXX] Detail Error:", error);
    return null;
  }
}
