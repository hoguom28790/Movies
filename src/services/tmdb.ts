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
    const yearParam = year ? `&year=${year}` : "";
    // Try movie first
    let response = await fetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}&language=vi-VN`
    );
    let data = await response.json();
    if (data.results?.length) return { ...data.results[0], media_type: "movie" };

    // Try TV if movie fails
    response = await fetch(
      `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&first_air_date_year=${year}` : ""}&language=vi-VN`
    );
    data = await response.json();
    if (data.results?.length) return { ...data.results[0], media_type: "tv" };

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

export function getTMDBImageUrl(path: string | null) {
  if (!path) return null;
  return `${IMAGE_BASE_URL}${path}`;
}

