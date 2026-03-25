import { MovieListResponse } from "@/types/movie";
import { getNguonCMovies } from "./nguonc";
import { getKKPhimMovies, searchMovies as searchKK } from "./kkphim";
import { getOPhimMovies, searchMovies as searchOP } from "./ophim";
import { normalizeTitle } from "@/lib/normalize";
export * from "./category";

const OPHIM_MIRRORS = ["https://ophim1.com", "https://ophim18.cc", "https://ophim17.com"];

export async function searchMovies(keyword: string, page: number = 1, section: "hop" | "tx" = "hop"): Promise<MovieListResponse> {
  console.log(`[API] Searching slug for title: ${keyword} in section: ${section}`);
  
  if (section === "tx") {
     const { searchTopXXMovies } = await import("./topxx");
     return searchTopXXMovies(keyword, page);
  }

  // 1. Try search on OPhim Mirrors
  for (const mirror of OPHIM_MIRRORS) {
    try {
      const res = await searchOP(keyword, page, mirror);
      if (res.items.length > 0) return res;
    } catch (e) {
      console.error(`[API] OPhim Search Mirror Failed (${mirror}):`, e);
    }
  }

  // 2. Try search on KKPhim
  try {
    const res = await searchKK(keyword, page);
    if (res.items.length > 0) return res;
  } catch (e) {}

  // 3. Normalized Fallback
  const cleanKeyword = normalizeTitle(keyword);
  if (cleanKeyword !== keyword.toLowerCase()) {
    try {
      // Try mirrors for normalized keyword too
      for (const mirror of OPHIM_MIRRORS) {
        const res = await searchOP(cleanKeyword, page, mirror);
        if (res.items.length > 0) return res;
      }
      const res = await searchKK(cleanKeyword, page);
      if (res.items.length > 0) return res;
    } catch (e) {}
  }

  return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
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
    const [nguonc, kkphim] = await Promise.allSettled([
      getNguonCMovies(page),
      getKKPhimMovies(page)
    ]);

    const items: any[] = [...ophimData.items];
    if (nguonc.status === "fulfilled") items.push(...nguonc.value.items);
    if (kkphim.status === "fulfilled") items.push(...kkphim.value.items);

    const merged = [];
    const maxLength = Math.max(items.length, items.length); // Dummy
    // ... merge logic stays similar but we use ophimData if available
    // Actually simplicity:
    const opItems = ophimData.items;
    const kkItems = kkphim.status === "fulfilled" ? kkphim.value.items : [];
    const ngItems = nguonc.status === "fulfilled" ? nguonc.value.items : [];

    const max = Math.max(opItems.length, kkItems.length, ngItems.length);
    for (let i = 0; i < max; i++) {
       if (opItems[i]) merged.push(opItems[i]);
       if (kkItems[i]) merged.push(kkItems[i]);
       if (ngItems[i]) merged.push(ngItems[i]);
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

  // Try OPhim Mirrors in sequence for detail (not parallel to avoid overloading)
  for (const mirror of OPHIM_MIRRORS) {
     try {
        const res = await fetch(`${mirror}/v1/api/phim/${slug}`, { 
          signal: AbortSignal.timeout(5000),
          cache: "no-store" 
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (json.data?.item) return { source: "ophim", data: { ...json.data.item, episodes: json.data.episodes } };
        if (json.movie) return { source: "ophim", data: { ...json.movie, episodes: json.episodes } };
     } catch(e) {
        console.error(`[API] OPhim Detail Mirror Failed (${mirror}):`, e);
     }
  }

  const [ng, kk] = await Promise.allSettled([
    fetch(`https://phim.nguonc.com/api/film/${slug}`).then((r) => r.json()).catch(() => null),
    fetch(`https://phimapi.com/v1/api/phim/${slug}`).then((r) => r.json()).catch(() => null),
  ]);
 
  if (kk.status === "fulfilled" && kk.value) {
     if (kk.value.data?.item) return { source: "kkphim", data: { ...kk.value.data.item, episodes: kk.value.data.episodes } };
     if (kk.value.movie) return { source: "kkphim", data: { ...kk.value.movie, episodes: kk.value.episodes } };
  }
  
  if (ng.status === "fulfilled" && ng.value?.movie) return { source: "nguonc", data: ng.value.movie };
 
  return null;
}
