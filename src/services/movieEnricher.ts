import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBImageUrl } from "./tmdb";

// Request-level cache to prevent duplicate enrichment in the same tree
const enrichmentCache = new Map<string, Movie>();

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const enrichSingle = async (movie: Movie): Promise<Movie> => {
    const cacheKey = `${movie.slug}_${movie.year || 'unknown'}`;
    if (enrichmentCache.has(cacheKey)) return enrichmentCache.get(cacheKey)!;

    try {
      const yearMatch = movie.year ? parseInt(movie.year) : undefined;
      const searchTasks = [
        searchTMDBMovie(movie.title, yearMatch)
      ];
      
      if (movie.originalTitle && movie.originalTitle !== movie.title) {
        searchTasks.push(searchTMDBMovie(movie.originalTitle, yearMatch));
      }

      // Try title matches first, then origin matches in parallel
      const results = await Promise.all(searchTasks);
      const tmdbSearch = results[0] || results[1];
          
      if (tmdbSearch) {
        const tmdbPoster = getTMDBImageUrl(tmdbSearch.poster_path || null, 'w500');
        const tmdbBackdrop = getTMDBImageUrl(tmdbSearch.backdrop_path || null, 'w1280');

        const enrichedMovie = {
          ...movie,
          imdbRating: tmdbSearch?.vote_average || movie.imdbRating || 0,
          posterUrl: tmdbPoster || movie.posterUrl || "",
          thumbUrl: tmdbBackdrop || tmdbPoster || movie.thumbUrl || "",
          overview: tmdbSearch?.overview || movie.overview || "",
        };
        
        enrichmentCache.set(cacheKey, enrichedMovie);
        return enrichedMovie;
      }

      enrichmentCache.set(cacheKey, movie);
      return movie;
    } catch (error) {
      console.error(`Error enriching movie ${movie.slug}:`, error);
      return movie;
    }
  };

  return Promise.all(movies.map(enrichSingle));
}
