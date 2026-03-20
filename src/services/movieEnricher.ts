import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBMovieDetails, getTMDBImageUrl } from "./tmdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      try {
        // Search for movie in TMDB
        const yearMatch = movie.year ? parseInt(movie.year) : undefined;
        const tmdbSearch = await searchTMDBMovie(movie.title, yearMatch);
        
        if (!tmdbSearch) return movie;

        // Get full details for genres and real fields
        const details = await getTMDBMovieDetails(tmdbSearch.id);
        if (!details) return movie;

        return {
          ...movie,
          originalTitle: details.original_title || movie.originalTitle,
          overview: details.overview || movie.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          imdbRating: details.vote_average || 0,
          // Optimization: Use TMDB backdrop for hero slider if available
          thumbUrl: details.backdrop_path ? (getTMDBImageUrl(details.backdrop_path) || movie.thumbUrl) : movie.thumbUrl,
          posterUrl: details.poster_path ? (getTMDBImageUrl(details.poster_path) || movie.posterUrl) : movie.posterUrl,
        };
      } catch (error) {
        console.error(`Error enriching movie ${movie.title}:`, error);
        return movie;
      }
    })
  );

  return enriched;
}
