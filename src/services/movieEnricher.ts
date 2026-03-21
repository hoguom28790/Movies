import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBImageUrl } from "./tmdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      let currentMovie = { ...movie };
      try {
        // High-Speed TMDB Poster/Backdrop Overrider for Homepage optimization
        // Bypasses getMovieDetails entirely!
        
        let tmdbId = currentMovie.tmdbId ? parseInt(currentMovie.tmdbId) : null;
        let mediaType: "movie" | "tv" = "movie";
        let fallbackPoster = null;
        let fallbackBackdrop = null;

        // Exhaustive Search to map ID and grab Images natively from search list
        const yearMatch = currentMovie.year ? parseInt(currentMovie.year) : undefined;
        const searchName = currentMovie.title;
        const searchOrigin = currentMovie.originalTitle || "";

        let tmdbSearch = null;
          
        if (yearMatch) {
          tmdbSearch = await searchTMDBMovie(searchName, yearMatch);
          if (!tmdbSearch && searchOrigin) {
            tmdbSearch = await searchTMDBMovie(searchOrigin, yearMatch);
          }
        }
          
        if (!tmdbSearch) {
          tmdbSearch = await searchTMDBMovie(searchName);
        }
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin);
        }
          
        if (tmdbSearch) {
          tmdbId = tmdbSearch.id;
          mediaType = tmdbSearch.media_type;
          fallbackPoster = tmdbSearch.poster_path;
          fallbackBackdrop = tmdbSearch.backdrop_path;
        }

        if (!tmdbId) return currentMovie;

        // Super fast assignment directly from search results without hitting details endpoint
        return {
          ...currentMovie,
          tmdbId: tmdbId.toString(),
          tmdbRating: tmdbSearch?.vote_average || currentMovie.tmdbRating,
          posterUrl: (fallbackPoster ? getTMDBImageUrl(fallbackPoster, 'w500') : currentMovie.posterUrl) ?? "",
          thumbUrl: (fallbackBackdrop ? getTMDBImageUrl(fallbackBackdrop, 'w780') : (fallbackPoster ? getTMDBImageUrl(fallbackPoster, 'w780') : currentMovie.thumbUrl)) ?? "",
        };
      } catch (error) {
        console.error(`Error enriching movie ${movie.slug}:`, error);
        return movie;
      }
    })
  );

  return enriched;
}
