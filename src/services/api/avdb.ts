const BASE_URL = "https://avdbapi.com/api.php?ac=detail&at=json";

export interface AVDBMovie {
  id: number;
  name: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  actor: string[] | string;
  director: string[] | string;
  year: string;
  quality: string;
  description: string;
  movie_code: string;
  episodes: {
    server_name?: string;
    server_data?: Record<string, string | { link_embed?: string }>;
  };
}

export interface AVDBResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: AVDBMovie[];
}

// Helper for timeout-safe fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Helper for retry logic
async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = 10000, retries = 2, delay = 800) {
  let lastError: Error | null = null;
  for (let i = 0; i < retries + 1; i++) {
    try {
      if (i > 0) {
        console.log(`[AVDB Search] Retrying (${i}/${retries}) for: ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return await fetchWithTimeout(url, options, timeout);
    } catch (err: any) {
      lastError = err;
      console.error(`[AVDB Search] Attempt ${i + 1} failed:`, err.message);
    }
  }
  throw lastError || new Error("All fetch attempts failed");
}

export async function getAVDBMovies(page = 1, typeId?: number, keyword?: string, actor?: string) {
  let url = `${BASE_URL}&pg=${page}`;
  if (typeId) url += `&t=${typeId}`;
  if (keyword) url += `&wd=${encodeURIComponent(keyword)}`;
  if (actor) url += `&vod_actor=${encodeURIComponent(actor)}`; // Help says vod_actor

  try {
    const res = await fetchWithRetry(url, { next: { revalidate: 3600 } }, 10000, 2, 800);
    if (!res.ok) return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
    
    let data: any;
    try {
      data = await res.json();
    } catch(e) {
      return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
    }
    
    if (!data || !data.list || !Array.isArray(data.list)) {
      return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
    }

    return {
      items: data.list.map((m: any) => {
        if (!m) return null;
        return {
          id: m.id?.toString() || Math.random().toString(),
          title: m.name || "No Title",
          originalTitle: m.movie_code || m.slug || "",
          slug: `av-${m.id}`,
          posterUrl: m.poster_url || "",
          thumbUrl: m.thumb_url || "",
          year: m.year || "",
          quality: m.quality || "HD",
          actor: Array.isArray(m.actor) ? m.actor.join(", ") : (m.actor || ""),
          source: 'avdb' as const
        };
      }).filter(Boolean),
      pagination: {
        totalItems: data.total || 0,
        totalPages: data.pagecount || 1,
        currentPage: data.page || 1,
      }
    };
  } catch (error) {
    console.error("AVDB API Error:", error);
    return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
  }
}

export async function getAVDBDetails(id: string) {
  const url = `${BASE_URL}&ids=${id}`;
  try {
    const res = await fetchWithTimeout(url, { cache: "no-store" }, 10000);
    const data: AVDBResponse = await res.json();
    if (!data.list || !data.list.length) return null;
    const movie = data.list[0];

    // Handle episode format
    const episodesData = movie.episodes?.server_data || {};
    const servers = [{
      server: movie.episodes?.server_name || "Server Premium",
      episodes: Object.entries(episodesData).map(([name, data]) => ({
        name: name,
        link: typeof data === 'string' ? data : data.link_embed
      }))
    }];

    return {
      ...movie,
      id: movie.id.toString(),
      title: movie.name,
      posterUrl: movie.poster_url,
      content: movie.description,
      servers: servers,
      source: 'avdb'
    };
  } catch (error) {
    console.error("AVDB Detail Error:", error);
    return null;
  }
}
