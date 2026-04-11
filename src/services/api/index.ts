import { Movie, MovieListResponse } from "@/types/movie";
import { getNguonCMovies, searchMovies as searchNG } from "./nguonc";
import { getKKPhimMovies, searchMovies as searchKK } from "./kkphim";
import { getOPhimMovies, searchMovies as searchOP } from "./ophim";
import { getVsmovMovies, searchMovies as searchVS } from "./vsmov";
import { normalizeTitle } from "@/lib/normalize";
import { TopXXMovie, TopXXResponse } from "@/types/api";
import { OPhimMovie, KKPhimMovie, NguonCMovie, VsmovMovie, ProviderMovie } from "@/types/api-providers";

export * from "./category";

const OPHIM_MIRRORS = [
  "https://ophim18.cc",
  "https://phimapi.com",
  "https://ophim17.com",
  "https://ophim17.cc",
  "https://ophim10.com",
  "https://ophim8.cc",
  "https://ophim10.cc",
  "https://vsmov.com"
];

const fetchSafe = async <T = any>(url: string, headers: Record<string, string> = {}, sourceId?: string): Promise<T | null> => {
  const tryFetch = async (targetUrl: string): Promise<T | null> => {
    const controller = new AbortController();
    const timeoutMs = (headers as any)._timeout || 5000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); 
    try {
      const res = await fetch(targetUrl, { 
        headers: { "Accept": "application/json", ...headers }, 
        signal: controller.signal,
        next: { revalidate: sourceId === 'topxx' ? 60 : 3600 }
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      return await res.json() as T;
    } catch (e) {
      clearTimeout(timeoutId);
      return null;
    }
  };

  const initialRes = await tryFetch(url);
  if (initialRes && (initialRes as any).status !== false) return initialRes;

  if (sourceId === 'ophim') {
     for (const mirror of OPHIM_MIRRORS) {
        // Try both v1 and root api versions as mirrors have varied structures
        const mirrorBase = mirror.replace(/\/$/, '');
        const urlsToTry = [
          url.replace(/https:\/\/[^\/]+/, mirrorBase),
          url.replace(/https:\/\/[^\/]+\/v1\/api/, `${mirrorBase}/api`) // Fallback to classic API path
        ];

        for (const mirrorUrl of urlsToTry) {
           const res = await tryFetch(mirrorUrl);
           if (res && (res as any).status !== false) return res;
        }
     }
  }
  
  return initialRes && (initialRes as any).status !== false ? initialRes : null;
};

export async function searchMovies(keyword: string, page: number = 1, section: "hop" | "tx" = "hop"): Promise<MovieListResponse> {
  console.log(`[API] Global Search: "${keyword}" (${section})`);
  
  const searchOPMirror = async (keyword: string, page: number) => {
    const res = await searchOP(keyword, page);
    if (res.items.length > 0) return res;
    
    // Fallback to mirrors
    for (const mirror of OPHIM_MIRRORS) {
      if (mirror.includes("phimapi.com")) continue;
      try {
        const mirrorRes = await searchOP(keyword, page, mirror);
        if (mirrorRes.items.length > 0) return mirrorRes;
      } catch (e) {}
    }
    return res;
  };

  const [opResults, kkResults, vsResults, ngResults] = await Promise.allSettled([
    searchOPMirror(keyword, page),
    searchKK(keyword, page),
    searchVS(keyword, page),
    searchNG(keyword, page)
  ]);

  let txResults: MovieListResponse = { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  let avdbResults: MovieListResponse = { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

  if (section === "tx") {
    try {
      const { searchTopXXMovies } = await import("./topxx");
      const { getAVDBMovies } = await import("./avdb");
      
      const [tx, av] = await Promise.allSettled([
        searchTopXXMovies(keyword, page),
        getAVDBMovies(page, undefined, keyword)
      ]);
      
      if (tx.status === "fulfilled") txResults = tx.value;
      if (av.status === "fulfilled") avdbResults = av.value;
    } catch (e) {}
  }

  const allItems: Movie[] = [];
  
  if (section === "tx") {
    // Interleave for variety
    const txItems = txResults.items || [];
    const avItems = avdbResults.items || [];
    const max = Math.max(txItems.length, avItems.length);
    for (let i = 0; i < max; i++) {
      if (txItems[i]) allItems.push(txItems[i]);
      if (avItems[i]) allItems.push(avItems[i]);
    }
    
    if (kkResults.status === "fulfilled") {
      allItems.push(...kkResults.value.items.filter((i: Movie) => i.title.toLowerCase().includes(keyword.toLowerCase())));
    }
  } else {
    if (opResults.status === "fulfilled") allItems.push(...opResults.value.items);
    if (kkResults.status === "fulfilled") allItems.push(...kkResults.value.items);
    if (vsResults.status === "fulfilled") allItems.push(...vsResults.value.items);
    if (ngResults.status === "fulfilled") allItems.push(...ngResults.value.items);
  }

  const seenSlugs = new Set();
  const BLOCKED_SLUGS = ["lac-mai-trong-khong-gian", "lost-in-space-forever"];

  const isTrailerMovie = (item: Movie) => {
    const t = item.title?.toLowerCase() || "";
    const s = item.status?.toLowerCase() || "";
    const q = item.quality?.toLowerCase() || "";
    
    return (
      t.includes("trailer") || 
      s.includes("trailer") || 
      q.includes("trailer") ||
      s.includes("tập 0") ||
      s.includes("0/0") ||
      s.includes("0/1") ||
      s.includes("0/?") ||
      s.includes("coming soon") ||
      s.includes("sắp chiếu") ||
      s.includes("phim sắp chiếu") ||
      s.includes("chưa phát sóng")
    );
  };

  const mergedItems = allItems.filter(item => {
    if (!item.slug || seenSlugs.has(item.slug) || BLOCKED_SLUGS.includes(item.slug)) return false;
    if (isTrailerMovie(item)) return false;
    seenSlugs.add(item.slug);
    return true;
  });

  const totalItems = section === "tx" 
    ? (txResults.pagination?.totalItems || 0) + (avdbResults.pagination?.totalItems || 0)
    : (opResults.status === "fulfilled" ? opResults.value.pagination.totalItems : 0) +
      (kkResults.status === "fulfilled" ? kkResults.value.pagination.totalItems : 0) +
      (vsResults.status === "fulfilled" ? vsResults.value.pagination.totalItems : 0) +
      (ngResults.status === "fulfilled" ? ngResults.value.pagination.totalItems : 0);

  return { 
    items: mergedItems, 
    pagination: { 
      currentPage: page, 
      totalPages: 100, 
      totalItems 
    } 
  };
}

export async function getLatestMovies(page: number = 1): Promise<MovieListResponse> {
  let ophimData: MovieListResponse = { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  for (const mirror of OPHIM_MIRRORS) {
     try {
        const res = await getOPhimMovies(page, mirror);
        if (res.items.length > 0) {
           ophimData = res;
           break;
        }
     } catch(e) {}
  }

  try {
    const [nguonc, kkphim, vsmov] = await Promise.allSettled([
      getNguonCMovies(page),
      getKKPhimMovies(page),
      getVsmovMovies(page)
    ]);

    const items: Movie[] = [...ophimData.items];
    if (nguonc.status === "fulfilled") items.push(...nguonc.value.items);
    if (kkphim.status === "fulfilled") items.push(...kkphim.value.items);
    if (vsmov.status === "fulfilled") items.push(...vsmov.value.items);

    const opItems = ophimData.items;
    const kkItems = kkphim.status === "fulfilled" ? kkphim.value.items : [];
    const ngItems = nguonc.status === "fulfilled" ? nguonc.value.items : [];
    const vsItems = vsmov.status === "fulfilled" ? vsmov.value.items : [];

    const merged: Movie[] = [];
    const seenKeys = new Set<string>();

    const isTrailerMovie = (item: Movie) => {
      const t = item.title?.toLowerCase() || "";
      const s = item.status?.toLowerCase() || "";
      const q = item.quality?.toLowerCase() || "";
      
      return (
        t.includes("trailer") || 
        s.includes("trailer") || 
        q.includes("trailer") ||
        s.includes("tập 0") ||
        s.includes("0/0") ||
        s.includes("0/1") ||
        s.includes("0/?") ||
        s.includes("coming soon") ||
        s.includes("sắp chiếu") ||
        s.includes("phim sắp chiếu") ||
        s.includes("chưa phát sóng")
      );
    };

    const max = Math.max(opItems.length, kkItems.length, ngItems.length, vsItems.length);
    for (let i = 0; i < max; i++) {
        [opItems[i], kkItems[i], ngItems[i], vsItems[i]].forEach(item => {
           if (item && item.slug) {
              const titleKey = `${normalizeTitle(item.title)}_${item.year}`;
              const BLOCKED_SLUGS = ["lac-mai-trong-khong-gian", "lost-in-space-forever"];
              
              if (!seenKeys.has(titleKey) && !seenKeys.has(item.slug) && !BLOCKED_SLUGS.includes(item.slug)) {
                 if (isTrailerMovie(item)) return;
                 
                 seenKeys.add(titleKey);
                 seenKeys.add(item.slug);
                 merged.push(item);
              }
           }
        });
    }

    return {
      items: merged,
      pagination: { currentPage: page, totalPages: 100, totalItems: merged.length * 8 }
    };
  } catch (error) {
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export interface UnifiedMovieSource {
  id: string;
  name: string;
  data: ProviderMovie;
}

export async function getMovieDetails(slug: string): Promise<{ sources: UnifiedMovieSource[] } | null> {
  if (!slug) return null;

  const availableSources: UnifiedMovieSource[] = [];

  // TopXX/AVDB sources have been explicitly removed per user request
  const isPossiblyTopXX = false;

  const [kkRes, ophimRes, ngRes, vsRes] = await Promise.allSettled([
    fetchSafe(`https://phimapi.com/phim/${slug}`, {}, 'kkphim'),
    fetchSafe(`https://ophim1.com/v1/api/phim/${slug}`, { Referer: "https://ophim1.com/" }, 'ophim'),
    fetchSafe(`https://phim.nguonc.com/api/film/${slug}`, {}, 'nguonc'),
    fetchSafe(`https://vsmov.com/api/phim/${slug}`, { Referer: "https://vsmov.com/" }, 'vsmov')
  ]);

  const processSource = (res: PromiseSettledResult<any>, sourceId: string, sourceName: string) => {
    if (res.status === "fulfilled" && res.value) {
      const data = res.value;
      if (data.status === false || data.msg === "Movie not found" || data.message === "Not Found") return;
      if (data.status === "success" && !data.movie && !data.data?.item) return; // Search result instead of detail

      const movie = data.data?.item || data.movie || data.movie_info;
      const episodes = data.data?.episodes || data.episodes || (movie as any)?.episodes || [];
      
      const hasContent = episodes.length > 0 || 
                        !!(movie.link_m3u8 || movie.link_embed || (movie.sources && movie.sources.length > 0));

      if (movie && (movie.slug || movie.id)) {
        availableSources.push({ 
            id: sourceId, 
            name: sourceName, 
            data: { ...movie, episodes: episodes, hasContent } as ProviderMovie
        });
      }
    }
  };

  processSource(kkRes, "kkphim", "KKPhim");
  processSource(ophimRes, "ophim", "OPhim");
  processSource(ngRes, "nguonc", "Nguồn C");
  processSource(vsRes, "vsmov", "VS-MOV");

  // SMART SEARCH FALLBACK: If NO sources found by direct slug, try searching by title (extracted from slug)
  if (availableSources.length === 0 && !isPossiblyTopXX) {
    const titleQuery = slug
      .split('-')
      .filter(word => !/^\d{4}$/.test(word)) // Remove year from search query for better matching
      .join(' ');
      
    console.log(`[API] Smart Fallback Search for: "${titleQuery}"`);
    
    try {
      let searchRes = await searchMovies(titleQuery, 1);
      
      // ITERATIVE BROAD SEARCH: If specific search fails, try progressively shorter queries
      // This handles movies like 'nhan-qua-outcome-2026' where the provider API only has 'nhan-qua'
      if (searchRes.items.length === 0) {
        let words = titleQuery.split(' ');
        while (searchRes.items.length === 0 && words.length > 1) {
          words.pop();
          const broadQuery = words.join(' ');
          console.log(`[API] Specific search failed, trying broader search: "${broadQuery}"`);
          searchRes = await searchMovies(broadQuery, 1);
        }
      }

      if (searchRes.items.length > 0) {
        // Find best match (compare slug or title) using normalized comparison
        const targetNormalized = normalizeTitle(titleQuery);
        const bestMatch = searchRes.items.find((item: any) => {
          const itemTitleNorm = normalizeTitle(item.title || "");
          const itemOriginNorm = normalizeTitle(item.originalTitle || "");
          
          return itemTitleNorm.includes(targetNormalized) || targetNormalized.includes(itemTitleNorm) || 
                 itemOriginNorm.includes(targetNormalized) || targetNormalized.includes(itemOriginNorm);
        }) || searchRes.items[0];

        if (bestMatch && bestMatch.slug !== slug) {
          console.log(`[API] Found alternative slug for "${slug}": ${bestMatch.slug} (Match: ${bestMatch.title})`);
          // Pass a timeout hint to prevent deep recursion hangs
          const altRes = await getMovieDetails(bestMatch.slug);
          if (altRes) return altRes;
        }
      }
    } catch (e) {
      console.error("[API] Smart search fallback error:", e);
    }
  }

  if (availableSources.length === 0) return null;

  const PRIORITY = ["ophim", "kkphim", "nguonc", "vsmov"];
  availableSources.sort((a, b) => {
    const idxA = PRIORITY.indexOf(a.id);
    const idxB = PRIORITY.indexOf(b.id);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return { sources: availableSources };
}

