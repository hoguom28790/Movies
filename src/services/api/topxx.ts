import { Movie, MovieListResponse } from "@/types/movie";
import { TopXXMovie, TopXXResponse } from "@/types/api-providers";
import * as cheerio from "cheerio";
import { getPosterUrl } from "@/lib/movie-utils";

const BASE_URL = "https://topxx.vip/api/v1";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://topxx.vip/'
};

interface ScrapedTopXX {
  code: string;
  title: string;
  thumbnail?: string;
}

/**
 * ELITE SCRAPER FALLBACK: As the TopXX Search API is currently broken/unreliable
 * for specific codes, we scrape the website's search page directly.
 */
async function scrapeTopXXSearch(keyword: string): Promise<ScrapedTopXX[]> {
  const url = `https://topxx.vip/search?keyword=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, 10000, 1, 500);
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: ScrapedTopXX[] = [];

    $("tr.tpx-row").each((_: any, row: any) => {
      const $row = $(row);
      const title = $row.find(".tpx-title").text().trim();
      const poster = $row.find(".tpx-poster img").attr("src");

      // Extract internal code (e.g. px7m0yKvZj)
      let internalCode = "";
      $row.find(".tpx-sub").each((_: any, el: any) => {
        const text = $(el).text().trim();
        // 1. Look for typical internal code format (10 alphanumeric chars inside parens)
        const matchParen = text.match(/\(([a-zA-Z0-9]{10,})\)/);
        if (matchParen) internalCode = matchParen[1];
        
        // 2. Look for "ID: [ID]"
        const matchID = text.match(/ID:\s*([a-zA-Z0-9]{10,})/i);
        if (matchID) internalCode = matchID[1];

        // 3. Look for direct 10-char alphanumeric if it looks like an ID
        if (!internalCode && /^[a-zA-Z0-9]{10}$/.test(text)) {
           internalCode = text;
        }
      });
      
      // Fallback: If still no ID but there's a link to /video/ or /movie/ with ID
      if (!internalCode) {
         const link = $row.find("a").attr("href") || "";
         const idMatch = link.match(/\/(video|movie)\/([a-zA-Z0-9]{10,})/);
         if (idMatch) internalCode = idMatch[2];
      }

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

/**
 * SCRAPER FALLBACK FOR DETAILS: Extracts metadata and sources from the movie page.
 */
async function scrapeTopXXDetails(slugOrId: string) {
  const url = `https://topxx.vip/video/${slugOrId}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, 10000, 2, 800);
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("h1.movie-title, .movie-info__title").text().trim() || $("title").text().split("|")[0].trim();
    const content = $(".movie-panel--description .panel-body, .movie-info__description").text().trim();
    const poster = $(".movie-poster img").attr("src");
    
    const sources: any[] = [];
    
    // Extract sources from the source-row structure
    $(".source-row").each((_: any, el: any) => {
       const $el = $(el);
       const embedUrl = $el.find("a[data-url], a.btn-primary").attr("data-url") || $el.find("a[target='_blank']").attr("href");
       const name = $el.find(".source-row__text").text().trim().split("|")[0].trim() || `SV ${sources.length + 1}`;
       
       if (embedUrl) {
          let finalLink = embedUrl;
          let isHls = false;
          
          if (embedUrl.includes('embed.streamxx.net/player/')) {
             const id = embedUrl.split('/player/')[1]?.split('?')[0];
             if (id) {
                finalLink = `https://embed.streamxx.net/stream/${id}/main.m3u8`;
                isHls = true;
             }
          }

          sources.push({
             link: finalLink,
             type: isHls ? "hls" : "embed",
             name: name,
             isHls: isHls
          });
       }
    });

    if (sources.length === 0) {
       // Secondary check for embedded iframes or links in scripts
       const scripts = $("script").text();
       const embedMatch = scripts.match(/https?:\/\/embed\.streamxx\.net\/player\/[a-zA-Z0-9]+/g);
       if (embedMatch) {
          (Array.from(new Set(embedMatch)) as string[]).forEach((link, idx) => {
             const id = link.split('/player/')[1]?.split('?')[0];
             if (id) {
                sources.push({ 
                   link: `https://embed.streamxx.net/stream/${id}/main.m3u8`, 
                   type: "hls", 
                   name: `SV ${idx + 1}`,
                   isHls: true
                });
             } else {
                sources.push({ link, type: "embed", name: `SV ${idx + 1}`, isHls: false });
             }
          });
       }
    }

    if (!title && sources.length === 0) return null;

    return {
      id: slugOrId,
      slug: slugOrId,
      code: "",
      trans: [{ locale: "vi", title, content }],
      poster_url: poster,
      sources: sources,
      source: "topxx_scraper"
    };
  } catch (err: any) {
    console.error(`[TopXX Detail Scraper] Error: ${err.message}`);
    return null;
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

function mapTopXXToMovie(item: TopXXMovie | ScrapedTopXX | any): Movie {
  if (!item) {
    return {
      id: "na",
      title: "Phim chưa xác định",
      originalTitle: "",
      slug: "",
      posterUrl: "",
      thumbUrl: "",
      quality: "HD",
      source: "topxx",
    };
  }

  const movieItem = item as any;
  const trans = Array.isArray(movieItem.trans) ? movieItem.trans : [];
  const viTrans = trans.find((t: any) => t && t.locale === "vi") || trans[0] || null;
  
  return {
    id: movieItem.id?.toString() || movieItem.code || movieItem.slug || Math.random().toString(),
    title: viTrans?.title || movieItem.title || movieItem.name || "Untitled Cinema",
    originalTitle: movieItem.origin_name || movieItem.original_name || "",
    slug: (movieItem.code || movieItem.slug || "").toString(),
    posterUrl: getPosterUrl(movieItem.poster_url || movieItem.thumbnail || movieItem.posterUrl || movieItem.thumb_path, 'topxx'),
    thumbUrl: getPosterUrl(movieItem.thumbnail || movieItem.poster_url || movieItem.thumb_path, 'topxx'),
    year: movieItem.publish_at ? new Date(movieItem.publish_at).getFullYear().toString() : (movieItem.year?.toString() || ""),
    quality: movieItem.quality || "Full HD",
    tmdbRating: movieItem.rating || 9.5,
    source: "topxx" as const
  };
}

export async function getTopXXMovies(
  type: "phim-moi" | "phim-hot" | "the-loai" | "quoc-gia" | "dien-vien" | "phim-le" | "phim-bo",
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
     if (slug === "phim-moi-cap-nhat") {
        url = `${BASE_URL}/movies/latest?page=${page}`;
     } else if (slug === "phim-le") {
        url = `${BASE_URL}/movies/latest?page=${page}`; // Fallback or specific le endpoint if known
     } else {
        url = `${BASE_URL}/genres/${slug}/movies?page=${page}`;
     }
  } else if (type === "quoc-gia") {
    url = `${BASE_URL}/countries/${slug}/movies?page=${page}`;
  }

  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, 10000, 2, 800);
    
    if (!res.ok) {
       console.log(`[TopXX] API failed for ${type}/${slug}, status: ${res.status}`);
       if (type === "the-loai" && slug) {
         try {
           const { getAVDBMoviesByCategory } = await import("./avdb");
           const avdbRes = await getAVDBMoviesByCategory(slug, page);
           if (avdbRes && avdbRes.items && avdbRes.items.length > 0) {
             return avdbRes;
           }
         } catch (avdbErr) {
           console.error("[TopXX] Fallback to AVDB failed:", avdbErr);
         }
       }
       return searchTopXXMovies(slug, page, true);
    }

    let jsonBody: TopXXResponse;
    try {
        jsonBody = await res.json();
    } catch (e) {
        console.error(`[TopXX] Failed to parse JSON for ${type}/${slug}`);
        return searchTopXXMovies(slug, page, true);
    }

    if (jsonBody.status !== "success" || !jsonBody.data) {
       console.log(`[TopXX] API returned status: ${jsonBody.status} for ${type}/${slug}`);
       return searchTopXXMovies(slug, page, true);
    }

    // Handle both cases: { data: [...] } and { data: { data: [...], meta: ... } }
    let rawItems: any[] = [];
    let meta = jsonBody.meta || (jsonBody.data as any).meta;

    if (Array.isArray(jsonBody.data)) {
        rawItems = jsonBody.data;
    } else if (jsonBody.data && typeof jsonBody.data === 'object' && Array.isArray((jsonBody.data as any).data)) {
        rawItems = (jsonBody.data as any).data;
        if (!meta) meta = (jsonBody.data as any);
    }

    if (rawItems.length === 0) {
        const isSpecialType = slug === "phim-moi-cap-nhat" || slug === "phim-le" || slug === "phim-bo";
        if (type === "the-loai" || type === "quoc-gia" || isSpecialType) {
          return searchTopXXMovies(slug, page, true);
        }
        return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }

    return {
      items: rawItems
        .filter(item => item && (item.code || item.slug))
        .map(item => mapTopXXToMovie(item)),
      pagination: {
        currentPage: Number(meta?.current_page || page),
        totalPages: Number(meta?.last_page || 1),
        totalItems: Number(meta?.total || 0)
      }
    };
  } catch (err) {
    console.warn(`[TopXX] Detail fetch fatal error for ${type}/${slug}:`, err);
    if (type === "the-loai" || type === "quoc-gia") {
      return searchTopXXMovies(slug, page, true);
    }
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(slug: string) {
  let finalId = slug;

  // 1. Handle code (STARS-420), find the internal ID (px7m0yKvZj)
  if (/^[a-zA-Z]{2,5}-\d{2,6}$/.test(slug)) {
    console.log(`[TopXX] Code detected: ${slug}. Searching for internal ID...`);
    const results = await scrapeTopXXSearch(slug);
    if (results && results.length > 0) {
      finalId = results[0].code;
      console.log(`[TopXX] Found internal ID: ${finalId} for code: ${slug}`);
    } else {
       const apiRes = await searchTopXXMovies(slug, 1);
       if (apiRes.items.length > 0) {
         finalId = apiRes.items[0].id;
       }
    }
  }

  const url = `${BASE_URL}/movies/${finalId}`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, 10000, 2, 800);
    
    if (!res.ok || res.status === 404) {
       console.log(`[TopXX] Detail not found for ${finalId}. Attempting search fallback...`);
       const sRes = await scrapeTopXXSearch(slug);
       if (sRes.length > 0 && sRes[0].code !== finalId) {
          return getTopXXDetails(sRes[0].code);
       }
    }

    let resData: any = null;
    if (res.ok) {
       const contentType = res.headers.get("content-type") || "";
       if (contentType.includes("application/json")) {
          try {
             resData = await res.json();
          } catch (e) {
             console.error("[TopXX] JSON parse failed", e);
          }
       } else {
          console.warn(`[TopXX] API returned unexpected content-type: ${contentType}`);
       }
    }

    if (!resData || resData.status !== "success" || !resData.data || Array.isArray(resData.data)) {
       console.log(`[TopXX] API unavailable or blocked, falling back to SCRAPER for: ${finalId}`);
       const scraped = await scrapeTopXXDetails(finalId);
       if (scraped) return scraped;

       // If scraper fails, try searching via AVDB
       if (/^[a-zA-Z]{2,5}-\d{2,6}$/.test(slug)) {
          console.log(`[TopXX Fallback] All TopXX sources failed for ${slug}. Attempting AVDB lookup...`);
          const { getAVDBMovies, getAVDBDetails } = await import("./avdb");
          const searchRes = await getAVDBMovies(1, undefined, slug);
          if (searchRes.items.length > 0) {
             const avid = searchRes.items[0].id;
             console.log(`[TopXX Fallback] Found in AVDB: ${avid}.`);
             return await getAVDBDetails(avid);
          }
       }
       return null;
    }

    const movie: TopXXMovie = resData.data;
    const viTrans = Array.isArray(movie.trans) ? (movie.trans.find((t) => t.locale === "vi") || movie.trans[0]) : null;
    
    const servers = [];

    // Native TopXX Sources
    if (movie.sources && Array.isArray(movie.sources) && movie.sources.length > 0) {
      const episodes = movie.sources.map((s: any, idx: number) => {
        let link = s.link;
        let isHls = false;
        
        // Auto-resolve StreamXX embed → direct HLS
        if (link?.includes('embed.streamxx.net/player/')) {
          const id = link.split('/player/')[1]?.split('?')[0];
          if (id) {
            link = `https://embed.streamxx.net/stream/${id}/main.m3u8`;
            isHls = true;
          }
        }
        
        return {
          name: `SV ${idx + 1}`,
          slug: `sv-${idx + 1}`,
          link_embed: isHls ? '' : link,
          link_m3u8: isHls ? link : '',
          link: link,
          isHls: isHls
        };
      });

      servers.push({
        server: "Cloud VIP",
        episodes: episodes
      });
    } else {
      let playLink = movie.video_url || movie.play_url || "";
      if (!playLink && movie.code) {
          playLink = `https://topxx.vip/play/index/${movie.code}`;
      }
      if (playLink && playLink.startsWith('/')) {
          playLink = `https://topxx.vip${playLink}`;
      }
      if (playLink) {
        servers.push({
           server: "Cloud VIP",
           episodes: [{
              name: "Full HD",
              slug: "full",
              link_embed: playLink,
              link_m3u8: ""
           }]
        });
      }
    }

    // Server 2 removal (JAVDB ELITES REMOVED)
    
    const finalSources = servers.flatMap((s: any) => 
      s.episodes.map((ep: any) => ({
        name: `${s.server} - ${ep.name}`,
        link: ep.link_embed || ep.link_m3u8 || ep.link,
        isHls: ep.isHls || (ep.link_m3u8?.length > 0)
      }))
    );

    return {
        ...movie,
        id: (movie as any).code || slug,
        name: viTrans?.title || movie.title || "No Title",
        title: viTrans?.title || movie.title || "No Title",
        posterUrl: movie.thumbnail,
        thumb_url: movie.thumbnail,
        content: viTrans?.description || movie.description || movie.content,
        sources: finalSources,
        source: 'topxx' as const,
        trans: movie.trans || []
    };
  } catch (err) {
    console.error("[TopXX] Fetch Detail Error:", err);
    return null;
  }
}

export async function searchTopXXMovies(keyword: string, page: number = 1, isCategorySearch: boolean = false): Promise<MovieListResponse> {
  const normalizedQuery = (keyword || "").trim().toLowerCase();

  if (!normalizedQuery) {
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }

  const SEARCH_TIMEOUT = 8000;
  const SEARCH_RETRIES = 1;

  const topxxUrl = `${BASE_URL}/movies/search?keyword=${encodeURIComponent(normalizedQuery)}&page=${page}`;
  const topxxActorUrl = `${BASE_URL}/actors?search=${encodeURIComponent(normalizedQuery)}&page=${page}`;

  try {
    console.log(`[TopXX Search] Initiating parallel search for: "${normalizedQuery}" (CategoryMode: ${isCategorySearch})`);

    const [topxxRes, topxxActorRes, topxxScrapedRes] = await Promise.allSettled([
      fetchWithRetry(`${BASE_URL}/movies/latest?page=${page}`, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, SEARCH_TIMEOUT, 0)
        .then(async r => {
          if (!r.ok) return null;
          const json: TopXXResponse = await r.json();
          return json?.status === "success" ? json : null;
        }),
      fetchWithRetry(topxxActorUrl, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, SEARCH_TIMEOUT, 0, 500)
        .then(async r => {
          if (!r.ok) return null;
          const json: TopXXResponse = await r.json();
          if (json?.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            const topActors = json.data.slice(0, 2);
            const actorMovies = await Promise.allSettled(
              topActors.map(async (actor) => {
                const actorSlug = actor.trans?.find((t: any) => t.locale === "vi")?.slug || actor.trans?.[0]?.slug;
                if (!actorSlug) return [];
                const url = `${BASE_URL}/actors/${actorSlug}/movies?page=1`;
                const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any, SEARCH_TIMEOUT, 0);
                if (res.ok) {
                  const data = await res.json();
                  return data.data || [];
                }
                return [];
              })
            );

            const extraMovies = actorMovies.flatMap(r => r.status === "fulfilled" ? r.value : []);
            return { ...json, extraMovies };
          }
          return json;
        }),
      scrapeTopXXSearch(normalizedQuery)
    ]);

    const movieMap = new Map<string, Movie>();
    let totalItems = 0;
    let totalPages = 1;

    const isLikelyRelevant = (m: Movie, q: string): boolean => {
      if (isCategorySearch) return true;
      const normQ = q.toLowerCase().trim();
      if (!normQ) return true;
      const searchSpace = `${m.title} ${m.slug} ${m.id}`.toLowerCase();
      const cleanSearchSpace = searchSpace.replace(/[^a-z0-9]/g, "");

      const codeMatch = normQ.match(/[a-z]{2,5}\s?\d{2,6}/i);
      if (codeMatch) {
        const fullCode = codeMatch[0].replace(/\s/g, "");
        const alpha = fullCode.match(/[a-z]+/i)?.[0] || "";
        const numeric = fullCode.match(/\d+/)?.[0] || "";
        if (cleanSearchSpace.includes(alpha) && cleanSearchSpace.includes(numeric)) return true;
      }

      const words = normQ.split(/\s+/).filter(w => w.length > 0);
      return words.every(word => {
        if (searchSpace.includes(word)) return true;
        const cleanWord = word.replace(/[^a-z0-9]/g, "");
        return cleanWord && cleanSearchSpace.includes(cleanWord);
      });
    };

    if (topxxRes.status === "fulfilled" && topxxRes.value) {
      const data = topxxRes.value;
      if (Array.isArray(data.data)) {
        data.data.forEach((item: TopXXMovie) => {
          const m = mapTopXXToMovie(item);
          if (isLikelyRelevant(m, normalizedQuery)) {
            movieMap.set(m.id, m);
          }
        });
      }
      totalItems = data.meta?.total || 0;
      totalPages = data.meta?.last_page || 1;
    }

    if (topxxActorRes.status === "fulfilled" && topxxActorRes.value) {
      const extraMovies = (topxxActorRes.value as any).extraMovies || [];
      extraMovies.forEach((m: TopXXMovie) => {
        const movie = mapTopXXToMovie(m);
        if (!movieMap.has(movie.id) && isLikelyRelevant(movie, normalizedQuery)) {
          movieMap.set(movie.id, movie);
        }
      });
    }

    if (topxxScrapedRes.status === "fulfilled" && Array.isArray(topxxScrapedRes.value)) {
      topxxScrapedRes.value.forEach((item: ScrapedTopXX) => {
        const m = mapTopXXToMovie(item);
        if (!movieMap.has(m.id)) {
          movieMap.set(m.id, m);
        }
      });
      if (totalItems === 0) {
        totalItems = Math.max(totalItems, topxxScrapedRes.value.length);
      }
    }

    const finalItems = Array.from(movieMap.values());
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
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any);
    if (!res.ok) return [];
    const data: TopXXResponse = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

export async function getTopXXCountries() {
  const url = `${BASE_URL}/countries`;
  try {
    const res = await fetchWithRetry(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } } as any);
    if (!res.ok) return [];
    const data: TopXXResponse = await res.json();
    return data.data || [];
  } catch (err) {
    return [];
  }
}

export async function getTopXXGenres() {
  return getTopXXCategories();
}
