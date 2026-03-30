const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "04c35731a5ee918f014970082a0088b1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

export interface TMDBActor {
  id: number;
  name: string;
  profile_path: string;
  character?: string;
}

export async function searchTMDBMovie(query: string, year?: number, typeHint?: "movie" | "tv"): Promise<{ id: number; media_type: "movie" | "tv"; poster_path?: string; backdrop_path?: string; vote_average?: number; overview?: string } | null> {
  try {
    const cleanQuery = (q: string) => q.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").replace(/Part\s+\d+/gi, "").trim();
    const q = cleanQuery(query);
    
    // Multi-strategy search
    const strategies = [
      // Priority 1: If typeHint is TV, try TV search with year first
      (typeHint === "tv" && year) ? `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&first_air_date_year=${year}&language=vi-VN` : null,
      
      // Original 1. Specific Search (Movie) with Year
      year ? `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&year=${year}&language=vi-VN` : null,
      
      // Original 2. Specific Search (TV) with Year (if not prioritized above)
      (typeHint !== "tv" && year) ? `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&first_air_date_year=${year}&language=vi-VN` : null,
      
      // 3. Multi Search (Catch-all)
      `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=vi-VN`,
      // 4. Multi Search without year as fallback
      `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`
    ].filter(Boolean);

    for (const url of strategies) {
      const res = await fetch(url!, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results?.length) {
        const bestMatch = data.results.find((r: any) => {
          const title = (r.title || r.name || "").toLowerCase();
          const original = (r.original_title || r.original_name || "").toLowerCase();
          const target = q.toLowerCase();
          return title === target || original === target || title.includes(target) || target.includes(title);
        }) || data.results[0];
        
        if (bestMatch.media_type === "person") continue;
        
        return { 
          id: bestMatch.id, 
          media_type: bestMatch.media_type || (url!.includes("/movie") ? "movie" : "tv"),
          poster_path: bestMatch.poster_path,
          backdrop_path: bestMatch.backdrop_path,
          vote_average: bestMatch.vote_average,
          overview: bestMatch.overview
        };
      }
    }
    return null;
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return null;
  }
}

export async function searchTMDBPerson(name: string): Promise<{ profile_path: string | null; id: number } | null> {
  try {
    const url = `${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    // Prioritize match with profile_path
    const bestMatch = results.find((r: any) => r.profile_path) || results[0];
    
    if (bestMatch) {
      return { profile_path: bestMatch.profile_path, id: bestMatch.id };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getTMDBMovieDetails(tmdbId: number, type: "movie" | "tv" = "movie") {
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=credits,images,external_ids,recommendations&include_image_language=vi,en,null`,
      { next: { revalidate: 3600 } }
    );
    return await response.json();
  } catch (error) {
    console.error("TMDB Details Error:", error);
    return null;
  }
}

export async function getTMDBActorDetails(actorId: number) {
  try {
    const response = await fetch(
      `${BASE_URL}/person/${actorId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=combined_credits,external_ids,translations`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    
    // Fallback biography logic: if vi-VN is empty, look for English in translations
    if (!data.biography && data.translations?.translations) {
      const enTranslation = data.translations.translations.find((t: any) => t.iso_639_1 === 'en');
      if (enTranslation?.data?.biography) {
        data.biography = enTranslation.data.biography;
        data.is_translated_fallback = true; // Flag for UI if needed
      }
    }
    
    return data;
  } catch (error) {
    console.error("TMDB Actor Error:", error);
    return null;
  }
}

export async function getTMDBCollection(collectionId: number) {
  try {
    const response = await fetch(
      `${BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=vi-VN`,
      { next: { revalidate: 3600 } }
    );
    return await response.json();
  } catch (error) {
    console.error("TMDB Collection Error:", error);
    return null;
  }
}

export async function getTrendingMovies(page: number = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    return await response.json();
  } catch (error) {
    console.error("TMDB Trending Error:", error);
    return null;
  }
}

export type TMDBImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

export function getTMDBImageUrl(path: string | null, size: TMDBImageSize = 'w500') {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const baseUrl = "https://image.tmdb.org/t/p/";
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${size}${cleanPath}`;
}

