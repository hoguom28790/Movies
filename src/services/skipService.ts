/**
 * Combined IntroDB (TV/movies) + AniSkip (anime) for crowdsourced skip timestamps
 */

export interface SkipTime {
  startTime: number;
  endTime: number;
  type: "op" | "ed" | "recap" | "mixed-outro";
}

const ANISKIP_API_URL = "https://api.aniskip.com/v1/skip-times";
const INTRODB_API_URL = "/api/introdb";

/**
 * Fetch skip times for Anime using AniSkip
 */
export async function fetchAniSkipTimes(malId: number, episode: number): Promise<SkipTime[]> {
  try {
    const url = `${ANISKIP_API_URL}/${malId}/${episode}?types[]=op&types[]=ed&types[]=recap&types[]=mixed-outro`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    if (json.found && Array.isArray(json.results)) {
      return json.results.map((r: any) => ({
        startTime: r.interval.start_time,
        endTime: r.interval.end_time,
        type: r.skip_type.toLowerCase() as SkipTime["type"]
      }));
    }
    return [];
  } catch (err) {
    console.error("AniSkip Error:", err);
    return [];
  }
}

/**
 * Fetch skip times for TV/Movies using IntroDB
 */
export async function fetchIntroDBTimes(tmdbId: number, season: number, episode: number): Promise<SkipTime[]> {
  try {
    const url = `${INTRODB_API_URL}/${tmdbId}/${season}/${episode}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    // Assuming IntroDB returns a similar structure or array of segments
    if (Array.isArray(json)) {
      return json.map((r: any) => ({
        startTime: r.startTime,
        endTime: r.endTime,
        type: r.type as SkipTime["type"]
      }));
    }
    return [];
  } catch (err) {
    // console.log("IntroDB skip suppressed");
    return [];
  }
}

/**
 * Logic fetch: 
 * - Check if anime -> fetch AniSkip
 * - Fallback to IntroDB
 * - Fallback to default 90s
 */
export async function getCombinedSkipTimes(params: {
  tmdbId?: number;
  malId?: number;
  season?: number;
  episode?: number;
  isAnime?: boolean;
}): Promise<SkipTime[]> {
  const { tmdbId, malId, season = 1, episode = 1, isAnime } = params;
  
  let results: SkipTime[] = [];

  // 1. Try AniSkip if it's anime and we have MAL ID
  if (isAnime && malId) {
    results = await fetchAniSkipTimes(malId, episode);
  }

  // 2. Try IntroDB if no results yet and we have TMDB ID
  if (results.length === 0 && tmdbId) {
    results = await fetchIntroDBTimes(tmdbId, season, episode);
  }

  // 3. Fallback to default (90s) if both failed - REMOVED per user request
  // if (results.length === 0) {
  //   results = [{ startTime: 0, endTime: 90, type: "op" }];
  // }

  return results;
}
