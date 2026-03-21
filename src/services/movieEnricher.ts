import { Movie } from "@/types/movie";
import { searchOMDbMovie, getFallbackPlaceholder } from "./omdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      let currentMovie = { ...movie };
      try {
        // High-Speed OMDb + Fanart.tv Poster/Backdrop Overrider for Homepage optimization
        // Bypasses getMovieDetails and TMDB entirely!
        
        let mediaType: "movie" | "tv" = "movie";
        let fallbackPoster = null;
        let fallbackBackdrop = null;
        let omdbSearch = null;

        // Exhaustive Search to map ID and grab Images natively from search list
        const yearMatch = currentMovie.year ? parseInt(currentMovie.year) : undefined;
        const searchName = currentMovie.title;
        const searchOrigin = currentMovie.originalTitle || "";

        if (yearMatch) {
          omdbSearch = await searchOMDbMovie(searchName, yearMatch, mediaType);
          if (!omdbSearch && searchOrigin) {
            omdbSearch = await searchOMDbMovie(searchOrigin, yearMatch, mediaType);
          }
        }
          
        if (!omdbSearch) {
          omdbSearch = await searchOMDbMovie(searchName, undefined, mediaType);
        }
        if (!omdbSearch && searchOrigin) {
          omdbSearch = await searchOMDbMovie(searchOrigin, undefined, mediaType);
        }
          
        if (omdbSearch) {
          fallbackPoster = omdbSearch.poster_path;
          fallbackBackdrop = omdbSearch.backdrop_path;
        }

        // Use Fallback Placeholders if no poster found at all
        const finalPoster = fallbackPoster && fallbackPoster !== "N/A" ? fallbackPoster : (currentMovie.posterUrl || getFallbackPlaceholder(searchName));
        const finalThumb = fallbackBackdrop && fallbackBackdrop !== "N/A" ? fallbackBackdrop : (fallbackPoster && fallbackPoster !== "N/A" ? fallbackPoster : (currentMovie.thumbUrl || finalPoster));

        // Super fast assignment directly from OMDb/Fanart results without hitting details endpoint
        return {
          ...currentMovie,
          imdbRating: omdbSearch?.vote_average || currentMovie.imdbRating || 0,
          posterUrl: finalPoster ?? "",
          thumbUrl: finalThumb ?? "",
        };
      } catch (error) {
        console.error(`Error enriching movie ${movie.slug}:`, error);
        return movie;
      }
    })
  );

  return enriched;
}
