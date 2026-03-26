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

// Retry wrapper
async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = 10000, retries = 2, delay = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(url, options, timeout);
      if (res.ok) return res;
      if (res.status === 404) return res; // Don't retry 404
    } catch (err: any) {
      if (i === retries - 1) throw err;
    }
    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
  }
  return fetchWithTimeout(url, options, timeout);
}

function mapTopXXToMovie(item: any): Movie {
  const viTrans = Array.isArray(item.trans) ? (item.trans.find((t: any) => t.locale === "vi") || item.trans[0]) : null;
  const enTrans = Array.isArray(item.trans) ? (item.trans.find((t: any) => t.locale === "en") || {}) : {};
  
  return {
    id: item.code || `tx-${Math.random().toString(36).substr(2, 9)}`,
    title: viTrans?.title || item.title || "No Title",
    originalTitle: enTrans?.title || "",
    slug: item.code || "",
    posterUrl: item.thumbnail || "",
    thumbUrl: item.thumbnail || "",
    year: item.publish_at ? new Date(item.publish_at).getFullYear().toString() : "",
    quality: item.quality || "HD",
    source: "topxx"
  };
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
    return searchTopXXMovies(slug, page);
  }

  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, 10000, 2, 800);
    if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    const data = await res.json();
    if (data.status !== "success" || !data.data) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    return {
      items: data.data.map(mapTopXXToMovie),
      pagination: {
        currentPage: data.meta?.current_page || page,
        totalPages: data.meta?.last_page || 1,
        totalItems: data.meta?.total || 0
      }
    };
  } catch (err) {
    console.error("[TopXX] Fetch Error:", err);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(slug: string) {
  const url = `${BASE_URL}/movies/${slug}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success" || !data.data) return null;
    return {
        ...data.data,
        id: data.data.code,
        source: 'topxx'
    };
  } catch (err) {
    console.error("[TopXX] Fetch Detail Error:", err);
    return null;
  }
}

export async function searchTopXXMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  const normalizedQuery = (keyword || "").trim().toLowerCase();
  
  if (!normalizedQuery) {
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }

  // OPTIMIZED: Use lower timeouts for Search to keep it responsive
  const SEARCH_TIMEOUT = 5000;
  const SEARCH_RETRIES = 1;

  const topxxUrl = `${BASE_URL}/movies/search?keyword=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  const topxxActorUrl = `${BASE_URL}/actors?search=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  
  try {
    console.log(`[TopXX Search] Initiating parallel search for: "${normalizedQuery}"`);
    
    // We run 5 main sources in parallel for maximum accuracy and speed
    // NOTE: Actor movies are now fetched nested inside the actor search to maximize parallelism
    const [topxxRes, topxxActorRes, topxxLatestSearchRes, avdbTitleRes, avdbActorRes] = await Promise.allSettled([
      fetchWithRetry(topxxUrl, { headers: DEFAULT_HEADERS }, SEARCH_TIMEOUT, SEARCH_RETRIES, 500)
        .then(async r => {
          if (!r.ok) return null;
          const json = await r.json();
          return json?.status === "success" ? json : null;
        }),
      fetchWithRetry(topxxActorUrl, { headers: DEFAULT_HEADERS }, SEARCH_TIMEOUT, SEARCH_RETRIES, 500)
        .then(async r => {
          if (!r.ok) return null;
          const json = await r.json();
          if (json?.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            // OPTIMIZATION: Start fetching filmography for the top 2 actors IMMEDIATELY 
            // This runs in parallel with other main search sources
            const topActors = json.data.slice(0, 2);
            const actorMovies = await Promise.allSettled(
              topActors.map(async (actor: any) => {
                const actorSlug = actor.trans?.find((t: any) => t.locale === "vi")?.slug || actor.trans?.[0]?.slug;
                if (!actorSlug) return [];
                const url = `${BASE_URL}/actors/${actorSlug}/movies?page=1`;
                const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, SEARCH_TIMEOUT, 0);
                if (res.ok) {
                  const data = await res.json();
                  return data.data || [];
                }
                return [];
              })
            );
            
            // Flatten found movies
            const extraMovies = actorMovies.flatMap(r => r.status === "fulfilled" ? r.value : []);
            return { ...json, extraMovies };
          }
          return json;
        }),
      fetchWithRetry(`${BASE_URL}/movies/latest?search=${encodeURIComponent(normalizedQuery)}&page=${page}`, { headers: DEFAULT_HEADERS }, SEARCH_TIMEOUT, SEARCH_RETRIES, 500)
        .then(async r => {
          if (!r.ok) return null;
          const json = await r.json();
          return json?.status === "success" ? json : null;
        }),
      getAVDBMovies(page, undefined, normalizedQuery)
        .catch(() => ({ items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } })),
      getAVDBMovies(page, undefined, undefined, normalizedQuery)
        .catch(() => ({ items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } }))
    ]);

    const movieMap = new Map<string, Movie>();
    let totalItems = 0;
    let totalPages = 1;

    const processTopXXData = (data: any) => {
      if (data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          const m = mapTopXXToMovie(item);
          movieMap.set(m.id, m);
        });
        totalItems = Math.max(totalItems, data.meta?.total || 0);
        totalPages = Math.max(totalPages, data.meta?.last_page || 1);
      }
    };

    // 1. Process TopXX Movie Search results
    if (topxxRes.status === "fulfilled") processTopXXData(topxxRes.value);
    if (topxxLatestSearchRes.status === "fulfilled") processTopXXData(topxxLatestSearchRes.value);

    // 2. Process TopXX Actor filmographies (collected in parallel)
    if (topxxActorRes.status === "fulfilled" && topxxActorRes.value) {
      const extraMovies = (topxxActorRes.value as any).extraMovies || [];
      extraMovies.forEach((m: any) => {
        const movie = mapTopXXToMovie(m);
        movieMap.set(movie.id, movie);
      });
    }

    // 3. Process AVDB Title Search
    if (avdbTitleRes.status === "fulfilled" && avdbTitleRes.value?.items) {
      avdbTitleRes.value.items.forEach((m: Movie) => {
        if (m && !movieMap.has(m.id)) movieMap.set(m.id, m);
      });
      totalItems = Math.max(totalItems, avdbTitleRes.value.pagination.totalItems);
      totalPages = Math.max(totalPages, avdbTitleRes.value.pagination.totalPages);
    }

    // 4. Process AVDB Actor Search
    if (avdbActorRes.status === "fulfilled" && avdbActorRes.value?.items) {
      avdbActorRes.value.items.forEach((m: Movie) => {
        if (m && !movieMap.has(m.id)) movieMap.set(m.id, m);
      });
      totalItems = Math.max(totalItems, avdbActorRes.value.pagination.totalItems);
      totalPages = Math.max(totalPages, avdbActorRes.value.pagination.totalPages);
    }

    const finalItems = Array.from(movieMap.values());
    console.log(`[TopXX Search] Completed for "${normalizedQuery}". Found ${finalItems.length} unique items.`);

    return {
      items: finalItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems || finalItems.length
      }
    };
  } catch (err) {
    console.error("[TopXX Search] Fatal Error:", err);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXCategories() {
  const url = `${BASE_URL}/genres`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

export async function getTopXXCountries() {
  const url = `${BASE_URL}/countries`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

export async function getTopXXGenres() {
  return getTopXXCategories();
}
