import { Movie, MovieListResponse } from "@/types/movie";

const BASE_URL = "https://topxx.vip/api/v1";

export async function getTopXXMovies(page: number = 1, type: "danh-sach" | "the-loai" | "quoc-gia" = "danh-sach", slug: string = "phim-moi-cap-nhat"): Promise<MovieListResponse> {
  const params = new URLSearchParams({
    page: page.toString()
  });

  const url = `${BASE_URL}/${type}/${slug}?${params}`;
  
  try {
    const res = await fetch(url, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    const data = await res.json();
    
    if (data.status !== "success") return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };

    const items: Movie[] = data.data.items.map((item: any) => ({
      id: item.slug,
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      posterUrl: item.poster_url?.startsWith('http') ? item.poster_url : `https://topxx.vip/uploads/movies/${item.poster_url}`,
      thumbUrl: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://topxx.vip/uploads/movies/${item.thumb_url}`,
      year: item.year?.toString() || "",
      status: item.status || item.episode_current || "",
      quality: item.quality || "",
      source: 'topxx'
    }));

    const pg = data.data.params.pagination;
    return {
      items,
      pagination: {
        currentPage: pg.currentPage,
        totalPages: Math.ceil(pg.totalItems / (pg.totalItemsPerPage || 20)),
        totalItems: pg.totalItems
      }
    };
  } catch (error) {
    console.error("TopXX Fetch Error:", error);
    return { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

export async function getTopXXDetails(slug: string) {
  const res = await fetch(`${BASE_URL}/phim/${slug}`, { 
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
}
