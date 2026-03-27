import { Movie, MovieListResponse } from "@/types/movie";
import { VsmovListResponse, VsmovResponse } from "@/types/api";

const BASE_URL = "https://vsmov.com/api";

export async function getVsmovMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, { 
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error("Failed to fetch Vsmov");
    const data: any = await res.json();
    
    // Vsmov usually provides full URLs in their API response
    const items: Movie[] = (data.items || []).map((item: any) => ({
      id: item.slug,
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://vsmov.com${item.poster_url.startsWith('/') ? '' : '/'}${item.poster_url}`,
      thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://vsmov.com${item.thumb_url.startsWith('/') ? '' : '/'}${item.thumb_url}`,
      year: item.year?.toString() || "",
      status: item.status || item.episode_current || "",
      source: 'vsmov' as const
    })).filter((item: Movie) => 
      item.status?.toLowerCase() !== "trailer"
    );

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
    const data: any = await res.json();
    
    if (data.status === false) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = (data.items || []).map((item: any) => ({
      id: item.slug,
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://vsmov.com${item.poster_url.startsWith('/') ? '' : '/'}${item.poster_url}`,
      thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://vsmov.com${item.thumb_url.startsWith('/') ? '' : '/'}${item.thumb_url}`,
      year: item.year?.toString() || "",
      quality: item.quality || "",
      status: item.status || item.episode_current || "",
      source: 'vsmov' as const
    })).filter((item: Movie) => 
      item.status?.toLowerCase() !== "trailer"
    );

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

