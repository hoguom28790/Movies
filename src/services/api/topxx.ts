import { Movie, MovieListResponse } from "@/types/movie";
import { getAVDBMovies } from "./avdb";
import * as cheerio from "cheerio";

const BASE_URL = "https://topxx.vip/api/v1";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://topxx.vip/'
};

/**
 * ELITE SCRAPER FALLBACK: As the TopXX Search API is currently broken/unreliable
 * for specific codes, we scrape the website's search page directly.
 */
async function scrapeTopXXSearch(keyword: string): Promise<any[]> {
  const url = `https://topxx.vip/search?keyword=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, 10000, 1, 500);
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: any[] = [];

    $("tr.tpx-row").each((_, row) => {
      const $row = $(row);
      const title = $row.find(".tpx-title").text().trim();
      const poster = $row.find(".tpx-poster img").attr("src");

      // Extract internal code (e.g. px7m0yKvZj) from potentially multiple .tpx-sub
      let internalCode = "";
      $row.find(".tpx-sub").each((_, el) => {
        const text = $(el).text().trim();
        // Look for typical internal code format (10 alphanumeric chars inside parens)
        const match = text.match(/\(([a-zA-Z0-9]{10})\)/);
        if (match) internalCode = match[1];
      });

      if (internalCode && title) {
        results.push({
          code: internalCode,
          title: title,
          thumbnail: poster
        });
      }
    });

    console.log(`[TopXX Scraper] Scraped ${results.length} items for "${keyword}"`);
    return results;
  } catch (err: any) {
    console.warn(`[TopXX Scraper] Error: ${err.message}`);
    return [];
  }
}

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
  type: "phim-moi" | "phim-hot" | "the-loai" | "quoc-gia" | "dien-vien",
  slug: string = "",
  page: number = 1
): Promise<MovieListResponse> {
  // 1. Handling Actors (routed to search)
  if (type === "dien-vien") {
    return searchTopXXMovies(slug, page);
  }

  let url = `${BASE_URL}/movies/latest?page=${page}`;
  if (type === "phim-hot") {
    url = `${BASE_URL}/movies/today?page=${page}`;
  } else if (type === "the-loai") {
    url = `${BASE_URL}/genres/${slug}/movies?page=${page}`;
  } else if (type === "quoc-gia") {
    url = `${BASE_URL}/countries/${slug}/movies?page=${page}`;
  }

  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, 10000, 2, 800);
    
    // 2. FALLBACK: Use search with isCategorySearch=true to bypass strict title checks
    if (!res.ok) {
       console.log(`[TopXX] API failed for ${type}/${slug}, falling back to category search.`);
       return searchTopXXMovies(slug, page, true);
    }

    const data = await res.json();
    if (data.status !== "success" || !data.data || (Array.isArray(data.data) && data.data.length === 0)) {
       // Also fallback if successfully called but empty (could be wrong code)
       if (type === "the-loai" || type === "quoc-gia") {
         return searchTopXXMovies(slug, page, true);
       }
       return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }

    return {
      items: data.data.map(mapTopXXToMovie),
      pagination: {
        currentPage: data.meta?.current_page || page,
        totalPages: data.meta?.last_page || 1,
        totalItems: data.meta?.total || 0
      }
    };
  } catch (err) {
    console.warn(`[TopXX] Detail fetch error for ${type}/${slug}, trying category search.`, err);
    if (type === "the-loai" || type === "quoc-gia") {
      return searchTopXXMovies(slug, page, true);
    }
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(slug: string) {
  let finalId = slug;

  // 1. If it's a code (STARS-420), find the internal ID (px7m0yKvZj)
  if (/^[a-zA-Z]{2,5}-\d{2,6}$/.test(slug)) {
    console.log(`[TopXX] Code detected: ${slug}. Searching for internal ID...`);
    const results = await scrapeTopXXSearch(slug);
    if (results && results.length > 0) {
      finalId = results[0].code;
      console.log(`[TopXX] Found internal ID: ${finalId} for code: ${slug}`);
    } else {
       // Also try API search as secondary fallback for codes
       const apiRes = await searchTopXXMovies(slug, 1);
       if (apiRes.items.length > 0) {
         finalId = apiRes.items[0].id;
       }
    }
  }

  const url = `${BASE_URL}/movies/${finalId}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success" || !data.data) return null;
    
    const movie = data.data;
    const viTrans = Array.isArray(movie.trans) ? (movie.trans.find((t: any) => t.locale === "vi") || movie.trans[0]) : null;
    
    // Normalize mapping for player
    // PRIORITY: Use direct video_url from API if available, then fallback to play_url or constructed index
    let playLink = movie.video_url || movie.play_url || `https://topxx.vip/play/index/${movie.code}`;
    
    // Some play links are relative, ensure absolute
    if (playLink && playLink.startsWith('/')) {
        playLink = `https://topxx.vip${playLink}`;
    }

    const episodes = [{
       name: "Full",
       slug: "full",
       link_embed: playLink,
       link_m3u8: ""
    }];
    
    const servers = [{
       server: "Cloud VIP",
       episodes: episodes
    }];

    return {
        ...movie,
        id: movie.code,
        name: viTrans?.title || movie.title || "No Title",
        title: viTrans?.title || movie.title || "No Title",
        posterUrl: movie.thumbnail,
        thumb_url: movie.thumbnail,
        content: viTrans?.description || movie.description,
        servers: servers,
        source: 'topxx'
    };
  } catch (err) {
    console.error("[TopXX] Fetch Detail Error:", err);
    return null;
  }
}

/**
 * TOPXX MEGA SEARCH: Combines API, Scraper, and AVDB
 * @param isCategorySearch If true, skips strict relevance filtering (useful for genre/tag matching)
 */
export async function searchTopXXMovies(keyword: string, page: number = 1, isCategorySearch: boolean = false): Promise<MovieListResponse> {
  const normalizedQuery = (keyword || "").trim().toLowerCase();

  if (!normalizedQuery) {
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }

  // OPTIMIZED: Use safer timeouts for search accuracy
  const SEARCH_TIMEOUT = 8000;
  const SEARCH_RETRIES = 1;

  const topxxUrl = `${BASE_URL}/movies/search?keyword=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  const topxxActorUrl = `${BASE_URL}/actors?search=${encodeURIComponent(normalizedQuery)}&page=${page}`;

  try {
    console.log(`[TopXX Search] Initiating parallel search for: "${normalizedQuery}" (CategoryMode: ${isCategorySearch})`);

    // We run 5 main sources in parallel (including Scraper fallback)
    const [topxxRes, topxxActorRes, topxxScrapedRes, avdbTitleRes, avdbActorRes] = await Promise.allSettled([
      fetchWithRetry(topxxUrl, { headers: DEFAULT_HEADERS }, SEARCH_TIMEOUT, SEARCH_RETRIES, 800)
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
      scrapeTopXXSearch(normalizedQuery),
      getAVDBMovies(page, undefined, normalizedQuery)
        .catch(() => ({ items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } })),
      getAVDBMovies(page, undefined, undefined, normalizedQuery)
        .catch(() => ({ items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } }))
    ]);

    const movieMap = new Map<string, Movie>();
    let totalItems = 0;
    let totalPages = 1;

    // Helper for strict relevance checking
    const isLikelyRelevant = (m: Movie, q: string): boolean => {
      if (isCategorySearch) return true; // Skip filtering for category fallbacks
      
      const normQ = q.toLowerCase().trim();
      if (!normQ) return true;
      
      const searchSpace = `${m.title} ${m.slug} ${m.id}`.toLowerCase();
      const cleanSearchSpace = searchSpace.replace(/[^a-z0-9]/g, "");

      // 1. Check for specific movie codes (e.g., DASS-534)
      const codeMatch = normQ.match(/[a-z]{2,5}\s?\d{2,6}/i);
      if (codeMatch) {
        const fullCode = codeMatch[0].replace(/\s/g, "");
        const alpha = fullCode.match(/[a-z]+/i)?.[0] || "";
        const numeric = fullCode.match(/\d+/)?.[0] || "";
        if (cleanSearchSpace.includes(alpha) && cleanSearchSpace.includes(numeric)) return true;
      }

      // 2. Keyword permutation match (e.g., "Yua Mikami" matches "Mikami Yua")
      const words = normQ.split(/\s+/).filter(w => w.length > 0);
      return words.every(word => {
        if (searchSpace.includes(word)) return true;
        const cleanWord = word.replace(/[^a-z0-9]/g, "");
        return cleanWord && cleanSearchSpace.includes(cleanWord);
      });
    };
    // 1. Process TopXX Movie Search results (Primary Source)
    if (topxxRes.status === "fulfilled" && topxxRes.value) {
      const data = topxxRes.value;
      if (Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          const m = mapTopXXToMovie(item);
          // Only add if it's broadly relevant to avoid "latest movies" noise
          if (isLikelyRelevant(m, normalizedQuery)) {
            movieMap.set(m.id, m);
          }
        });
      }
      totalItems = data.meta?.total || 0;
      totalPages = data.meta?.last_page || 1;
    }

    // 2. Process TopXX Actor filmographies (Parallel cached result)
    if (topxxActorRes.status === "fulfilled" && topxxActorRes.value) {
      const extraMovies = (topxxActorRes.value as any).extraMovies || [];
      extraMovies.forEach((m: any) => {
        const movie = mapTopXXToMovie(m);
        if (!movieMap.has(movie.id) && isLikelyRelevant(movie, normalizedQuery)) {
          movieMap.set(movie.id, movie);
        }
      });
    }

    // 3. Process TopXX Scraped results (ELITE Fallback for broken API)
    if (topxxScrapedRes.status === "fulfilled" && Array.isArray(topxxScrapedRes.value)) {
      topxxScrapedRes.value.forEach((item: any) => {
        const m = mapTopXXToMovie(item);
        if (!movieMap.has(m.id)) { // Scraped results are usually very specific, no need for extra relevance check
          movieMap.set(m.id, m);
        }
      });
      if (totalItems === 0) {
        totalItems = Math.max(totalItems, topxxScrapedRes.value.length);
      }
    }

    // 4. Process AVDB Title Search
    if (avdbTitleRes.status === "fulfilled" && avdbTitleRes.value?.items) {
      avdbTitleRes.value.items.forEach((m: Movie) => {
        if (m && !movieMap.has(m.id) && isLikelyRelevant(m, normalizedQuery)) {
          movieMap.set(m.id, m);
        }
      });
      if (totalItems === 0) {
        totalItems = avdbTitleRes.value.pagination.totalItems;
        totalPages = avdbTitleRes.value.pagination.totalPages;
      }
    }

    // 5. Process AVDB Actor Search
    if (avdbActorRes.status === "fulfilled" && avdbActorRes.value?.items) {
      avdbActorRes.value.items.forEach((m: Movie) => {
        if (m && !movieMap.has(m.id) && isLikelyRelevant(m, normalizedQuery)) {
          movieMap.set(m.id, m);
        }
      });
      if (totalItems === 0) {
        totalItems = Math.max(totalItems, avdbActorRes.value.pagination.totalItems);
        totalPages = Math.max(totalPages, avdbActorRes.value.pagination.totalPages);
      }
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
