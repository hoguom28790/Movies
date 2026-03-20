import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://topxx.vip/api/v1";

export async function getTopXXMovies(page: number = 1, type: "danh-sach" | "the-loai" | "quoc-gia" = "danh-sach", slug: string = "phim-moi-cap-nhat"): Promise<MovieListResponse> {
  let url = `${BASE_URL}/movies/latest?page=${page}`;
  
  if (type === "the-loai") {
    // API docs say: /movies?genre={code}
    url = `${BASE_URL}/movies?genre=${slug}&page=${page}`;
  } else if (type === "quoc-gia") {
    // API docs say: /countries/{code}/movies
    url = `${BASE_URL}/countries/${slug}/movies?page=${page}`;
  }

  try {
    const res = await fetch(url, { 
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://topxx.vip/'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    const data = await res.json();
    
    if (data.status !== "success" || !data.data) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = data.data.map((item: any) => {
      const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
      const enTrans = item.trans?.find((t: any) => t.locale === "en") || {};
      
      return {
        id: item.code,
        title: viTrans?.title || "No Title",
        originalTitle: enTrans?.title || "",
        // CRITICAL: use 'code' as slug to ensure detail URL works with /movies/{code}
        slug: item.code, 
        posterUrl: item.thumbnail || "",
        thumbUrl: item.thumbnail || "",
        year: item.publish_at ? new Date(item.publish_at).getFullYear().toString() : "",
        status: item.quality || "",
        quality: item.quality || "HD",
        source: 'topxx'
      };
    });

    const meta = data.meta;
    return {
      items,
      pagination: {
        currentPage: meta.current_page,
        totalPages: meta.last_page,
        totalItems: meta.total
      }
    };
  } catch (error) {
    console.error("TopXX Fetch Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(code: string) {
  try {
    const res = await fetch(`${BASE_URL}/movies/${code}`, { 
      cache: "no-store",
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://topxx.vip/'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error("TopXX Detail Error:", error);
    return null;
  }
}
