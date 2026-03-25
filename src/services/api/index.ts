import { MovieListResponse } from "@/types/movie";
import { getNguonCMovies } from "./nguonc";
import { getKKPhimMovies, searchMovies as searchKK } from "./kkphim";
import { getOPhimMovies, searchMovies as searchOP } from "./ophim";
import { normalizeTitle } from "@/lib/normalize";
export * from "./category";

export async function searchMovies(keyword: string, page: number = 1, section: "hop" | "tx" = "hop"): Promise<MovieListResponse> {
  console.log(`[API] Searching slug for title: ${keyword} in section: ${section}`);
  
  if (section === "tx") {
     const { searchTopXXMovies } = await import("./topxx");
     return searchTopXXMovies(keyword, page);
  }

  // 1. Try search on OPhim
  try {
    const res = await searchOP(keyword, page);
    if (res.items.length > 0) return res;
  } catch (e) {}

  // 2. Try search on KKPhim
  try {
    const res = await searchKK(keyword, page);
    if (res.items.length > 0) return res;
  } catch (e) {}

  // 3. Normalized Fallback
  const cleanKeyword = normalizeTitle(keyword);
  if (cleanKeyword !== keyword.toLowerCase()) {
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

  const [ng, kk, op] = await Promise.allSettled([
    fetch(`https://phim.nguonc.com/api/film/${slug}`).then((r) => r.json()).catch(() => null),
    fetch(`https://phimapi.com/v1/api/phim/${slug}`).then((r) => r.json()).catch(() => null),
    fetch(`https://ophim1.com/v1/api/phim/${slug}`).then((r) => r.json()).catch(() => null),
  ]);
 
  if (kk.status === "fulfilled" && kk.value?.data?.item) return { source: "kkphim", data: kk.value.data.item };
  if (op.status === "fulfilled" && op.value?.data?.item) return { source: "ophim", data: op.value.data.item };
  if (kk.status === "fulfilled" && kk.value?.movie) return { source: "kkphim", data: kk.value.movie };
  if (op.status === "fulfilled" && op.value?.movie) return { source: "ophim", data: op.value.movie };
  if (ng.status === "fulfilled" && ng.value?.movie) return { source: "nguonc", data: ng.value.movie };
 
  return null;
}
