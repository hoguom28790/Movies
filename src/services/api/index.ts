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
  "Accept": "application/json",
  "Referer": "https://ophim18.cc/"
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
  const isTopXX = slug.startsWith("av-") || /^[A-Z]{2,5}-\d{2,6}$/i.test(slug);

  if (isTopXX) {
     const { getAVDBDetails } = await import("./avdb");
     const { getTopXXDetails } = await import("./topxx");
     const id = slug.startsWith("av-") ? slug.split("av-")[1] : slug;
     const [av, tx] = await Promise.allSettled([getAVDBDetails(id), getTopXXDetails(slug)]);
     if (tx.status === "fulfilled" && tx.value) return { source: "topxx", data: tx.value };
     if (av.status === "fulfilled" && av.value) return { source: "avdb", data: av.value };
     return null;
  }

  // 1. Parallel Mirror Check for OPhim (Speed & Resilience)
  try {
    const ophimData = await Promise.any(OPHIM_MIRRORS.map(async (mirror) => {
      const cleanMirror = mirror.endsWith('/') ? mirror.slice(0, -1) : mirror;
      const res = await fetch(`${cleanMirror}/v1/api/phim/${slug}`, { 
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(4000),
        cache: "no-store" 
      });
      if (!res.ok) throw new Error("404");
      const json = await res.json();
      const movie = json.data?.item || json.movie;
      if (!movie) throw new Error("No data");
      const episodes = json.data?.episodes || json.episodes || movie.episodes || [];
      return { source: "ophim", data: { ...movie, episodes } };
    }));
    if (ophimData) return ophimData;
  } catch (e) {
    // console.log("All OPhim mirrors failed for slug:", slug);
  }

  // 2. Fallback to KKPhim & NguonC
  const [ng, kk] = await Promise.allSettled([
    fetch(`https://phim.nguonc.com/api/film/${slug}`, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(4000) }).then((r) => r.json()).catch(() => null),
    fetch(`https://phimapi.com/v1/api/phim/${slug}`, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(4000) }).then((r) => r.json()).catch(() => null),
  ]);
 
  if (kk.status === "fulfilled" && kk.value) {
     const movie = kk.value.data?.item || kk.value.movie;
     if (movie) return { source: "kkphim", data: { ...movie, episodes: kk.value.data?.episodes || kk.value.episodes } };
  }
  
  if (ng.status === "fulfilled" && ng.value?.movie) return { source: "nguonc", data: ng.value.movie };
 
  return null;
}
