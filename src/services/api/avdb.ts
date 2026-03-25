const BASE_URL = "https://avdbapi.com/api.php/provide/vod/at/json?ac=detail";

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

export async function getAVDBMovies(page = 1, typeId?: number, keyword?: string, actor?: string) {
  let url = `${BASE_URL}&pg=${page}`;
  if (typeId) url += `&t=${typeId}`;
  if (keyword) url += `&wd=${encodeURIComponent(keyword)}`;
  if (actor) url += `&actor=${encodeURIComponent(actor)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data: AVDBResponse = await res.json();
    
    if (!data.list || !Array.isArray(data.list)) return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };

    return {
      items: data.list.map(m => ({
        id: m.id.toString(),
        title: m.name,
        originalTitle: m.movie_code || m.slug,
        slug: `av-${m.id}`,
        posterUrl: m.poster_url,
        thumbUrl: m.thumb_url,
        year: m.year,
        quality: m.quality || "HD",
        actor: Array.isArray(m.actor) ? m.actor.join(", ") : m.actor,
        source: 'avdb' as const
      })),
      pagination: {
        totalItems: data.total,
        totalPages: data.pagecount,
        currentPage: data.page,
      }
    };
  } catch (error) {
    console.error("AVDB API Error:", error);
    return { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 1 } };
  }
}

export async function getAVDBDetails(id: string) {
  const url = `${BASE_URL}&ids=${id}`;
  try {
    const res = await fetch(url);
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
