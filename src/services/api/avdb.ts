const BASE_URL = "https://avdbapi.com/api.php/provide/vod?ac=detail";

export interface AVDBMovie {
  vod_id: number;
  vod_name: string;
  vod_sub: string;
  vod_en: string;
  vod_letter: string;
  type_id: number;
  type_name: string;
  vod_pic: string;
  vod_lang: string;
  vod_area: string;
  vod_year: string;
  vod_actor: string;
  vod_director: string;
  vod_content: string;
  vod_play_from: string;
  vod_play_url: string;
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
    
    // Map to normalized movie format
    return {
      items: data.list.map(m => ({
        id: m.vod_id.toString(),
        title: m.vod_name,
        originalTitle: m.vod_en || m.vod_sub,
        slug: `av-${m.vod_id}`, // Prefix with av- to distinguish source
        posterUrl: m.vod_pic,
        thumbUrl: m.vod_pic,
        year: m.vod_year,
        quality: "HD",
        actor: m.vod_actor,
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
    const movie = data.list[0];
    if (!movie) return null;

    // Parse play URLs (format: Server Name$$$Name1$URL1#Name2$URL2)
    const servers = movie.vod_play_from.split("$$$");
    const urls = movie.vod_play_url.split("$$$");
    
    const epData = servers.map((server, idx) => {
      const episodes = urls[idx].split("#").map(ep => {
        const [name, link] = ep.split("$");
        return { name, link };
      });
      return { server, episodes };
    });

    return {
      ...movie,
      id: movie.vod_id.toString(),
      title: movie.vod_name,
      posterUrl: movie.vod_pic,
      content: movie.vod_content,
      servers: epData,
      source: 'avdb'
    };
  } catch (error) {
    console.error("AVDB Detail Error:", error);
    return null;
  }
}
