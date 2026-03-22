import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBImageUrl } from "./tmdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      let currentMovie = { ...movie };
      try {
        // High-Quality TMDB Poster/Backdrop Overrider for Homepage optimization
        
        let tmdbSearch = null;

        const yearMatch = currentMovie.year ? parseInt(currentMovie.year) : undefined;
        const searchName = currentMovie.title;
        const searchOrigin = currentMovie.originalTitle || "";

        // Strategy 1: Search with Year
        if (yearMatch) {
          tmdbSearch = await searchTMDBMovie(searchName, yearMatch);
          if (!tmdbSearch && searchOrigin) {
            tmdbSearch = await searchTMDBMovie(searchOrigin, yearMatch);
          }
        }
          
        // Strategy 2: Search without Year (Fuzzy fallback)
        if (!tmdbSearch) {
          tmdbSearch = await searchTMDBMovie(searchName);
        }
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin);
        }
          
        if (tmdbSearch) {
          const tmdbPoster = getTMDBImageUrl(tmdbSearch.poster_path || null, 'w500');
          const tmdbBackdrop = getTMDBImageUrl(tmdbSearch.backdrop_path || null, 'w1280');

          return {
            ...currentMovie,
            imdbRating: tmdbSearch?.vote_average || currentMovie.imdbRating || 0,
            posterUrl: tmdbPoster || currentMovie.posterUrl || "",
            thumbUrl: tmdbBackdrop || tmdbPoster || currentMovie.thumbUrl || "",
          };
        }

        return currentMovie;
      } catch (error) {
        console.error(`Error enriching movie ${movie.slug}:`, error);
        return movie;
      }
    })
  );

  return enriched;
}
