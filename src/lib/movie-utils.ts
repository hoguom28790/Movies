/**
 * ELITE MOVIE UTILS: CENTRALIZED SOURCE & METADATA NORMALIZATION
 */

export const TOPXX_CODE_REGEX = /^[A-Z]{2,6}-\d{2,6}$/i;
export const TOPXX_INTERNAL_REGEX = /^[a-zA-Z0-9]{10,32}$/;
export const AVDB_ID_REGEX = /^av-\d+$/;

export type MovieSource = 'ophim' | 'kkphim' | 'nguonc' | 'vsmov' | 'topxx' | 'avdb' | 'unknown';

/**
 * DETECTS THE SOURCE TYPE FROM SLUG AND AN OPTIONAL HINT
 */
export function getMovieSource(slug: string, sourceHint?: string): MovieSource {
  if (sourceHint === 'topxx' || sourceHint === 'avdb') return sourceHint as MovieSource;
  
  if (AVDB_ID_REGEX.test(slug) || slug.startsWith('av-')) return 'avdb';
  if (TOPXX_CODE_REGEX.test(slug) || TOPXX_INTERNAL_REGEX.test(slug)) return 'topxx';
  
  if (sourceHint) return sourceHint as MovieSource;
  
  return 'ophim'; // Default
}

/**
 * NORMALIZES POSTER URLS ACROSS ALL PROVIDERS
 */
export function getPosterUrl(path: string | null | undefined, source?: MovieSource): string {
  if (!path) return "https://placehold.co/600x900/111111/4ade80?text=No+Poster";
  
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.replace(/^\/+/, '');
  
  switch (source) {
    case 'ophim':
      return `https://img.ophim1.com/uploads/movies/${cleanPath}`;
    case 'kkphim':
      return `https://phimimg.com/uploads/movies/${cleanPath}`;
    case 'nguonc':
      return `https://phim.nguonc.com/uploads/movies/${cleanPath}`;
    case 'vsmov':
      return `https://vsmov.com/uploads/movies/${cleanPath}`;
    case 'topxx':
    case 'avdb':
      return path; 
    default:
      return path.startsWith('http') ? path : `https://img.ophim1.com/uploads/movies/${cleanPath}`;
  }
}

/**
 * CLEAN TITLES BY REMOVING METADATA STRINGS
 */
export function cleanMovieTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(/\(\d{4}\)/, "") // Remove year in parens
    .replace(/\[.*\]/, "")     // Remove brackets
    .replace(/(phan|part|season|tap)\s*\d+/gi, "") // Remove episodic markers for search
    .trim();
}

/**
 * NORMALIZES MULTI-LANGUAGE TITLES FROM TOPXX/AVDB
 */
export function normalizeMovieData(data: any, source: MovieSource) {
  const isTopXX = source === 'topxx' || source === 'avdb';
  
  let name = data.name || data.title || data.origin_name;
  let originName = data.origin_name || data.original_name || data.movie_code || "";
  
  if (isTopXX) {
    // Handle data.trans as array or object
    const trans = Array.isArray(data.trans) ? data.trans : [];
    const vi = trans.find((t: any) => t.locale === "vi") || (data.trans?.vi ? { ...data.trans.vi, locale: 'vi' } : null);
    const en = trans.find((t: any) => t.locale === "en") || (data.trans?.en ? { ...data.trans.en, locale: 'en' } : null);
    
    if (vi?.title) name = vi.title;
    if (en?.title) originName = en.title;
    else if (data.movie_code) originName = data.movie_code;
  }
  
  // Safe year extraction
  let year = data.year || "";
  if (!year && data.publish_at) {
     const date = new Date(data.publish_at);
     if (!isNaN(date.getTime())) year = date.getFullYear().toString();
  }
  
  return {
    name: name || "Đang cập nhật",
    originName: originName,
    year: year,
    description: data.content || data.description || (data.trans?.find?.((t: any) => t.locale === "vi")?.description) || data.summary || "",
    posterUrl: getPosterUrl(data.posterUrl || data.poster_url || data.thumbnail || data.thumb_url || data.thumb_path, source),
    quality: data.quality || data.episode_current || "HD/4K",
    category: Array.isArray(data.category) 
      ? data.category 
      : (typeof data.category === 'object' && data.category !== null) 
          ? Object.values(data.category).flatMap((c: any) => c.list?.map((i: any) => i.name) || [c.name]).filter(Boolean)
          : (data.categories || []),
    country: Array.isArray(data.country) 
      ? data.country 
      : (typeof data.country === 'object' && data.country !== null)
          ? Object.values(data.country).flatMap((c: any) => c.list?.map((i: any) => i.name) || [c.name]).filter(Boolean)
          : (data.countries || []),
    code: data.movie_code || data.code || "",
    source: source,
    tmdb_id: data.tmdb_id || null,
    lang: data.lang || data.language || "Vietsub",
    type: data.type === "series" || data.type === "hoathinh" ? "Phim Bộ" : "Phim Lẻ",
    age: data.age || "13+",
    episodeCurrent: data.episode_current || "",
    episodeTotal: data.episode_total || "",
    episodes: (data.episodes || []).map((s: any) => ({
       name: s.server_name || s.name || "Default",
       items: (s.server_data || s.items || []).map((ep: any) => {
          const rawM3u8 = ep.link_m3u8 || ep.m3u8 || "";
          return {
            ...ep,
            link_embed: ep.link_embed || ep.embed || ep.link || "",
            link_m3u8: (source === 'nguonc' || rawM3u8.includes("phimmoi.net")) ? "" : rawM3u8
          };
       })
    })),
    status: data.status || data.episode_current || "HD"
  };
}
