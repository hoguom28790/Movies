const TMDB_API_KEY = "3fd2be6f0c70a2a598f084dd5754b980"; // Added missing 0 at the end
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

export async function searchTMDBMovie(title: string, year?: number) {
  try {
    const cleanTitle = (t: string) => t.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").trim();
    const q = cleanTitle(title);
    const yearParam = year ? `&year=${year}` : "";
    
    // 1. Try TV search first for suspected series (common in current catalog)
    let response = await fetch(
      `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}${year ? `&first_air_date_year=${year}` : ""}&language=vi-VN`
    );
    let data = await response.json();
    if (data.results?.length) return { ...data.results[0], media_type: "tv" };

    // 2. Try Movie search
    response = await fetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}${yearParam}&language=vi-VN`
    );
    data = await response.json();
    if (data.results?.length) return { ...data.results[0], media_type: "movie" };

    // 3. Try Multi search without year as ultimate fallback
    response = await fetch(
      `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=vi-VN`
    );
    data = await response.json();
    if (data.results?.length) {
      const best = data.results.find((r: any) => r.media_type !== "person");
      if (best) return best;
    }

    return null;
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return null;
  }
}

export async function getTMDBMovieDetails(tmdbId: number, type: "movie" | "tv" = "movie") {
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=credits,images,external_ids,recommendations&include_image_language=vi,en,null`
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
      `${BASE_URL}/person/${actorId}?api_key=${TMDB_API_KEY}&language=vi-VN&append_to_response=movie_credits`
    );
    return await response.json();
  } catch (error) {
    console.error("TMDB Actor Error:", error);
    return null;
  }
}

export async function getTMDBCollection(collectionId: number) {
  try {
    const response = await fetch(
      `${BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=vi-VN`
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
      `${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`
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
  const baseUrl = "https://image.tmdb.org/t/p/";
  return `${baseUrl}${size}${path}`;
}

