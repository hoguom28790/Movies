import { MovieListResponse } from "@/types/movie";
import { getNguonCMovies } from "./nguonc";
import { getKKPhimMovies, searchMovies as searchKK } from "./kkphim";
import { getOPhimMovies, searchMovies as searchOP } from "./ophim";
import { normalizeTitle } from "@/lib/normalize";
export * from "./category";

export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  console.log(`[API] Searching slug for title: ${keyword}`);
  
  // 1. Try search on KKPhim
  try {
    const res = await searchKK(keyword, page);
    if (res.items.length > 0) {
      console.log(`[API] Found ${res.items.length} results on KKPhim`);
      return res;
    }
  } catch (e) {
    console.error("KKPhim search failed", e);
  }

  // 2. Try search on OPhim
  try {
    const res = await searchOP(keyword, page);
    if (res.items.length > 0) {
      console.log(`[API] Found ${res.items.length} results on OPhim`);
      return res;
    }
  } catch (e) {
    console.error("OPhim search failed", e);
  }

  // 3. Normalized Fallback
  const cleanKeyword = normalizeTitle(keyword);
  if (cleanKeyword !== keyword.toLowerCase()) {
    console.log(`[API] Re-searching with normalized title: ${cleanKeyword}`);
    try {
      const res = await searchKK(cleanKeyword, page);
      if (res.items.length > 0) return res;
      return await searchOP(cleanKeyword, page);
    } catch (e) {}
  }

  return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
}

export async function getLatestMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const [nguonc, kkphim, ophim] = await Promise.allSettled([
      getNguonCMovies(page),
      getKKPhimMovies(page),
      getOPhimMovies(page)
    ]);

    const items = [];
    if (nguonc.status === "fulfilled") items.push(...nguonc.value.items);
    if (kkphim.status === "fulfilled") items.push(...kkphim.value.items);
    if (ophim.status === "fulfilled") items.push(...ophim.value.items);

    const maxLength = Math.max(
      nguonc.status === "fulfilled" ? nguonc.value.items.length : 0,
      kkphim.status === "fulfilled" ? kkphim.value.items.length : 0,
      ophim.status === "fulfilled" ? ophim.value.items.length : 0
    );

    const merged = [];
    for (let i = 0; i < maxLength; i++) {
      if (nguonc.status === "fulfilled" && nguonc.value.items[i]) merged.push(nguonc.value.items[i]);
      if (kkphim.status === "fulfilled" && kkphim.value.items[i]) merged.push(kkphim.value.items[i]);
      if (ophim.status === "fulfilled" && ophim.value.items[i]) merged.push(ophim.value.items[i]);
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
  const [ng, kk, op] = await Promise.allSettled([
    fetch(`https://phim.nguonc.com/api/film/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
    fetch(`https://phimapi.com/v1/api/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
    fetch(`https://ophim1.com/v1/api/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
  ]);
 
  if (kk.status === "fulfilled" && kk.value?.status === "success" && kk.value?.data?.item)
    return { source: "kkphim", data: kk.value.data.item };
  if (op.status === "fulfilled" && op.value?.status === "success" && op.value?.data?.item)
    return { source: "ophim", data: op.value.data.item };
  if (kk.status === "fulfilled" && kk.value?.status === true && kk.value?.movie)
    return { source: "kkphim", data: kk.value.movie };
  if (op.status === "fulfilled" && op.value?.status === true && op.value?.movie)
    return { source: "ophim", data: op.value.movie };
  if (ng.status === "fulfilled" && ng.value?.status === "success" && ng.value?.movie)
    return { source: "nguonc", data: ng.value.movie };
 
  return null;
}
