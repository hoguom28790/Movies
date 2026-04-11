import { Movie, MovieListResponse } from "@/types/movie";
import { VsmovListResponse, VsmovResponse } from "@/types/api-providers";

const BASE_URL = "https://vsmov.com/api";

export async function getVsmovMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, { 
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error("Failed to fetch Vsmov");
    const data: VsmovListResponse = await res.json();
    
    // Vsmov usually provides full URLs in their API response
    const items: Movie[] = (data.items || []).map((item) => {
      const ps = String(item.poster_url || "");
      const ts = String(item.thumb_url || "");
      return {
        id: String(item.slug),
        title: item.title || item.name || "",
        originalTitle: item.origin_title || item.origin_name || "",
        slug: item.slug,
        posterUrl: ps.startsWith('http') ? ps : `https://vsmov.com${ps.startsWith('/') ? '' : '/'}${ps}`,
        thumbUrl: ts.startsWith('http') ? ts : `https://vsmov.com${ts.startsWith('/') ? '' : '/'}${ts}`,
        year: item.year?.toString() || "",
        status: item.status || item.episode_current || "",
        source: 'vsmov' as const
      };
    }).filter((item: Movie) => {
      const s = (item.status || "").toLowerCase();
      const sl = (item.slug || "").toLowerCase();
      const t = (item.title || "").toLowerCase();
      
      return !s.includes("trailer") && 
             !sl.includes("trailer") && 
             !t.includes("trailer") &&
             !s.includes("sắp chiếu") &&
             !s.includes("coming soon") &&
             !s.includes("tập 0");
    });

    return {
      items,
      pagination: {
        currentPage: data.pagination?.currentPage || page,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.totalItems || 0
      }
    };
  } catch (error) {
    console.error("Vsmov API Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function searchMovies(keyword: string, page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`, { 
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error("Failed to search Vsmov");
    const data: VsmovListResponse = await res.json();
    
    if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = (data.items || []).map((item) => {
      const ps = String(item.poster_url || "");
      const ts = String(item.thumb_url || "");
      return {
        id: String(item.slug),
        title: item.title || item.name || "",
        originalTitle: item.origin_title || item.origin_name || "",
        slug: item.slug,
        posterUrl: ps.startsWith('http') ? ps : `https://vsmov.com${ps.startsWith('/') ? '' : '/'}${ps}`,
        thumbUrl: ts.startsWith('http') ? ts : `https://vsmov.com${ts.startsWith('/') ? '' : '/'}${ts}`,
        year: item.year?.toString() || "",
        quality: item.quality || "",
        status: item.status || item.episode_current || "",
        source: 'vsmov' as const
      };
    }).filter((item: Movie) => {
      const s = (item.status || "").toLowerCase();
      const sl = (item.slug || "").toLowerCase();
      const t = (item.title || "").toLowerCase();
      
      return !s.includes("trailer") && 
             !sl.includes("trailer") && 
             !t.includes("trailer") &&
             !s.includes("sắp chiếu") &&
             !s.includes("coming soon") &&
             !s.includes("tập 0");
    });

    const pg = data.pagination;
    return {
      items,
      pagination: {
        currentPage: pg?.currentPage || page,
        totalPages: pg?.totalPages || 1,
        totalItems: pg?.totalItems || 0
      }
    };
  } catch (error) {
    console.error("Vsmov Search Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getVsmovDetails(slug: string): Promise<VsmovResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/phim/${slug}`, { 
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

