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
  "https://vsmov.com"
];

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json"
};

export async function searchMovies(keyword: string, page: number = 1, section: "hop" | "tx" = "hop"): Promise<MovieListResponse> {
  console.log(`[API] Searching slug for title: ${keyword} in section: ${section}`);
  
  if (section === "tx") {
     const { searchTopXXMovies } = await import("./topxx");
     return searchTopXXMovies(keyword, page);
  }

  // Combine multiple sources in parallel
  const [opResults, kkResults, vsResults] = await Promise.allSettled([
    searchOP(keyword, page),
    searchKK(keyword, page),
    searchVS(keyword, page)
  ]);

  const allItems: any[] = [];
  if (opResults.status === "fulfilled") allItems.push(...opResults.value.items);
  if (kkResults.status === "fulfilled") allItems.push(...kkResults.value.items);
  if (vsResults.status === "fulfilled") allItems.push(...vsResults.value.items);

  // Fallback for mirrors if main OPhim fails
  if (opResults.status === "rejected" || opResults.value.items.length === 0) {
    for (const mirror of OPHIM_MIRRORS) {
      if (mirror.includes("ophim1.com")) continue;
      try {
        const mirrorRes = await searchOP(keyword, page, mirror);
        if (mirrorRes.items.length > 0) {
          allItems.push(...mirrorRes.items);
          break;
        }
      } catch (e) {}
    }
  }

  // Deduplicate by slug
  const seenSlugs = new Set();
  const mergedItems = allItems.filter(item => {
    if (seenSlugs.has(item.slug)) return false;
    seenSlugs.add(item.slug);
    return true;
  });

  const totalItems = (opResults.status === "fulfilled" ? opResults.value.pagination.totalItems : 0) +
                     (kkResults.status === "fulfilled" ? kkResults.value.pagination.totalItems : 0) +
                     (vsResults.status === "fulfilled" ? vsResults.value.pagination.totalItems : 0);

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
  const isTopXXCode = /^[A-Z]{2,5}-\d{2,6}$/i.test(slug);
  const isTopXXInternal = /^[a-zA-Z0-9]{10}$/.test(slug);
  const isTopXX = slug.startsWith("av-") || isTopXXCode || isTopXXInternal;

  if (isTopXX) {
     const { getAVDBDetails } = await import("./avdb");
     const { getTopXXDetails } = await import("./topxx");
     const id = slug.startsWith("av-") ? slug.split("av-")[1] : slug;
     
     // 1. Try parallel exact fetch
     const [av, tx] = await Promise.allSettled([getAVDBDetails(id), getTopXXDetails(slug)]);
     
     if (tx.status === "fulfilled" && tx.value) return { sources: [{ id: "topxx", data: tx.value }] };
     if (av.status === "fulfilled" && av.value) return { sources: [{ id: "avdb", data: av.value }] };

      // 2. Fallback: Search all providers if it looks like a code (e.g. DASS-876) but ID fetch failed
      if (isTopXXCode || isTopXXInternal) {
         const { getAVDBMovies } = await import("./avdb");
         const { searchTopXXMovies } = await import("./topxx");
         
         const [avSearch, txSearch] = await Promise.allSettled([
            getAVDBMovies(1, undefined, slug),
            searchTopXXMovies(slug, 1)
         ]);

         if (txSearch.status === "fulfilled" && txSearch.value?.items.length > 0) {
            const firstItem = txSearch.value.items[0];
            const { getTopXXDetails } = await import("./topxx");
            const fullDetails = await getTopXXDetails(firstItem.id).catch(() => null);
            if (fullDetails) return { sources: [{ id: "topxx", data: fullDetails }] };
         }

         if (avSearch.status === "fulfilled" && avSearch.value?.items.length > 0) {
            const firstItem = avSearch.value.items[0];
            const { getAVDBDetails } = await import("./avdb");
            const fullDetails = await getAVDBDetails(firstItem.id.replace('av-', '')).catch(() => null);
            if (fullDetails) return { sources: [{ id: "avdb", data: fullDetails }] };
         }
      }
     
     return null;
  }

  // Helper for safe fetch with manual timeout
  const fetchSafe = async (url: string, headers: any = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s
    try {
      const res = await fetch(url, { 
        headers: { ...DEFAULT_HEADERS, ...headers }, 
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

  // 1. Parallel Full Multi-Source Fetch
  const [ophimRes, kkRes, ngRes, vsRes] = await Promise.allSettled([
    // OPhim (Primary Mirror)
    fetchSafe(`https://vsmov.com/api/phim/${slug}`, { Referer: "https://vsmov.com/" }),
    // KKPhim (Main)
    fetchSafe(`https://phimapi.com/v1/api/phim/${slug}`),
    // NguonC
    fetchSafe(`https://phim.nguonc.com/api/film/${slug}`),
    // OPhim (Backup Mirror)
    fetchSafe(`https://ophim1.com/v1/api/phim/${slug}`, { Referer: "https://ophim1.com/" })
  ]);

  const availableSources: { id: string, name: string, data: any }[] = [];
  
  if (ophimRes.status === "fulfilled" && ophimRes.value) {
    const json = ophimRes.value;
    const movie = json.data?.item || json.movie;
    if (movie) availableSources.push({ 
      id: "ophim", 
      name: "OPhim", 
      data: { ...movie, episodes: json.data?.episodes || json.episodes || movie.episodes || [] } 
    });
  }

  if (kkRes.status === "fulfilled" && kkRes.value) {
    const json = kkRes.value;
    const movie = json.data?.item || json.movie;
    if (movie) availableSources.push({ 
      id: "kkphim", 
      name: "KKPhim", 
      data: { ...movie, episodes: json.data?.episodes || json.episodes || movie.episodes || [] } 
    });
  }

  if (ngRes.status === "fulfilled" && ngRes.value) {
    const json = ngRes.value;
    const movie = json.movie || json.data?.item;
    if (movie) availableSources.push({ 
      id: "nguonc", 
      name: "NguonC", 
      data: { ...movie, episodes: json.episodes || movie.episodes || [] } 
    });
  }

  if (vsRes.status === "fulfilled" && vsRes.value) {
    const json = vsRes.value;
    const movie = json.movie || json.data?.item;
    if (movie) availableSources.push({ 
      id: "vsmov", 
      name: "VS-MOV", 
      data: { ...movie, episodes: json.episodes || json.data?.episodes || [] } 
    });
  }

  if (availableSources.length === 0) return null;

  return { sources: availableSources };
}
