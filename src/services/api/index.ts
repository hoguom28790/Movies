import { MovieListResponse } from "@/types/movie";
import { getNguonCMovies } from "./nguonc";
import { getKKPhimMovies, searchMovies as searchKK } from "./kkphim";
import { getOPhimMovies, searchMovies as searchOP } from "./ophim";
import { getVsmovMovies, searchMovies as searchVS } from "./vsmov";
import { normalizeTitle } from "@/lib/normalize";
export * from "./category";

const OPHIM_MIRRORS = [
  "https://ophim1.com", 
  "https://ophim18.cc", 
  "https://ophim17.com", 
  "https://ophim17.cc", 
  "https://ophim10.com",
  "https://ophim8.cc",
  "https://ophim10.cc",
  "https://vsmov.com",
  "https://phimapi.com"
];

// Helper for safe fetch with manual timeout
const fetchSafe = async (url: string, headers: any = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); 
  try {
    const res = await fetch(url, { 
      headers: { 
        "Accept": "application/json",
        ...headers 
      }, 
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    return null;
  }
};

export async function searchMovies(keyword: string, page: number = 1, section: "hop" | "tx" = "hop"): Promise<MovieListResponse> {
  console.log(`[API] Global Search: "${keyword}" (${section})`);
  
  // 1. Parallel search across ALL standard providers
  const [opResults, kkResults, vsResults] = await Promise.allSettled([
    searchOP(keyword, page),
    searchKK(keyword, page),
    searchVS(keyword, page)
  ]);

  // 2. Also search TopXX/AVDB (Premium Sources) in parallel
  let txResults: any = { items: [] };
  try {
     const { searchTopXXMovies } = await import("./topxx");
     txResults = await searchTopXXMovies(keyword, page).catch(() => ({ items: [] }));
  } catch (e) {}

  const allItems: any[] = [];
  
  // Combine all sources, prioritizing section-specific results but including everything for discovery
  if (section === "tx") {
     if (txResults.items) allItems.push(...txResults.items);
     if (kkResults.status === "fulfilled") allItems.push(...kkResults.value.items.filter((i: any) => i.title.toLowerCase().includes(keyword.toLowerCase())));
  } else {
     if (opResults.status === "fulfilled") allItems.push(...opResults.value.items);
     if (kkResults.status === "fulfilled") allItems.push(...kkResults.value.items);
     if (vsResults.status === "fulfilled") allItems.push(...vsResults.value.items);
     // Include TopXX in Home Search if no results found elsewhere or if it's a code
     if (txResults.items) allItems.push(...txResults.items);
  }

  // Deduplicate by slug
  const seenSlugs = new Set();
  const mergedItems = allItems.filter(item => {
    if (!item.slug || seenSlugs.has(item.slug)) return false;
    seenSlugs.add(item.slug);
    return true;
  });

  const totalItems = mergedItems.length > 0 ? (
     (opResults.status === "fulfilled" ? opResults.value.pagination.totalItems : 0) +
     (kkResults.status === "fulfilled" ? kkResults.value.pagination.totalItems : 0) +
     (txResults.pagination?.totalItems || 0)
  ) : 0;

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
  // Try to find a healthy OPhim mirror for latest
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

    const items: any[] = [...ophimData.items];
    if (nguonc.status === "fulfilled") items.push(...nguonc.value.items);
    if (kkphim.status === "fulfilled") items.push(...kkphim.value.items);
    if (vsmov.status === "fulfilled") items.push(...vsmov.value.items);

    const merged = [];
    const opItems = ophimData.items;
    const kkItems = kkphim.status === "fulfilled" ? kkphim.value.items : [];
    const ngItems = nguonc.status === "fulfilled" ? nguonc.value.items : [];
    const vsItems = vsmov.status === "fulfilled" ? vsmov.value.items : [];

    const max = Math.max(opItems.length, kkItems.length, ngItems.length, vsItems.length);
    for (let i = 0; i < max; i++) {
       if (opItems[i]) merged.push(opItems[i]);
       if (kkItems[i]) merged.push(kkItems[i]);
       if (ngItems[i]) merged.push(ngItems[i]);
       if (vsItems[i]) merged.push(vsItems[i]);
    }

    return {
      items: merged,
      pagination: { currentPage: page, totalPages: 100, totalItems: merged.length * 100 }
    };
  } catch (error) {
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getMovieDetails(slug: string) {
  if (!slug) return null;

  // Pattern detection for Premium Sources (TopXX/AVDB)
  const isTopXXCode = /^[a-zA-Z]{2,6}-\d{2,6}$/i.test(slug) && (slug.match(/-/g) || []).length === 1;
  const isTopXXInternal = /^[a-zA-Z0-9]{10}$/.test(slug);
  const isPossiblyTopXX = slug.startsWith("av-") || isTopXXCode || isTopXXInternal;

  const availableSources: { id: string, name: string, data: any }[] = [];

  // 1. If possibly TopXX/AV-Movie, try those with HIGH PRIORITY
  if (isPossiblyTopXX) {
    try {
       const { getTopXXDetails } = await import("./topxx");
       const { getAVDBDetails } = await import("./avdb");
       
       const txValue = await getTopXXDetails(slug).catch(() => null);
       if (txValue) availableSources.push({ id: "topxx", name: "TopXX", data: txValue });
       
       if (availableSources.length === 0) {
          const avId = slug.startsWith("av-") ? slug.split("av-")[1] : slug;
          const avValue = await getAVDBDetails(avId).catch(() => null);
          if (avValue) availableSources.push({ id: "avdb", name: "AVDB", data: avValue });
       }
    } catch {}
  }

  // 2. Execute parallel check for ALL standard sources with robust timeouts
  const [kkRes, ophimRes, ngRes, vsRes] = await Promise.allSettled([
    fetchSafe(`https://phimapi.com/v1/api/phim/${slug}`),
    fetchSafe(`https://ophim1.com/v1/api/phim/${slug}`, { Referer: "https://ophim1.com/" }),
    fetchSafe(`https://phim.nguonc.com/api/film/${slug}`),
    fetchSafe(`https://vsmov.com/api/phim/${slug}`, { Referer: "https://vsmov.com/" })
  ]);

  const processSource = (res: any, sourceId: string, sourceName: string) => {
    if (res.status === "fulfilled" && res.value) {
      const data = res.value;
      // Many providers return status: false or "Movie not found" inside 200 OK
      if (data.status === false || data.msg === "Movie not found" || data.message === "Not Found") return;

      const movie = data.data?.item || data.movie || data.movie_info;
      const episodes = data.data?.episodes || data.episodes || movie?.episodes || [];
      
      // CRITICAL: Filter out sources that have no episodes or report errors (avoid 404/Empty buttons)
      if (movie && (movie.slug || movie.id) && episodes.some((s: any) => (s.server_data || s.items || []).length > 0)) {
        availableSources.push({ 
            id: sourceId, 
            name: sourceName, 
            data: { ...movie, episodes } 
        });
      }
    }
  };

  processSource(kkRes, "kkphim", "KKPhim");
  processSource(ophimRes, "ophim", "OPhim");
  processSource(ngRes, "nguonc", "Nguồn C");
  processSource(vsRes, "vsmov", "VS-MOV");

  if (availableSources.length === 0) return null;

  // 3. HEALTH-BASED SORTING: Prioritize sources that actually have episode links (not empty 200s)
  availableSources.sort((a, b) => {
     // Count servers/episodes that have actual content
     const getLinkCount = (src: any) => {
        const eps = src.data.episodes || [];
        return eps.reduce((count: number, server: any) => count + (server.server_data?.length || 0), 0);
     };
     const countA = getLinkCount(a);
     const countB = getLinkCount(b);
     return countB - countA; // Source with more links comes first
  });

  return { sources: availableSources };
}
