import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBMovieDetails, getTMDBImageUrl } from "./tmdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const { getIMDbRating } = await import("./imdb");
  const { getMovieDetails } = await import("./api");
 
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      let currentMovie = { ...movie };
      try {
        // Step 1: Fetch full source details if we're missing internal IDs or description
        // List APIs in OPhim/KKPhim are very basic; the detail API is where the good data is.
        const sourceDetail = await getMovieDetails(movie.slug).catch(() => null);
        
        if (sourceDetail?.data) {
          const sd = sourceDetail.data;
          currentMovie = {
            ...movie,
            overview: sd.content || sd.description || movie.overview,
            tmdbId: sd.tmdb?.id || sd.tmdb_id || movie.tmdbId,
            imdbId: sd.imdb?.id || sd.imdb_id || movie.imdbId,
            tmdbRating: sd.tmdb?.vote_average || movie.tmdbRating,
            imdbRating: sd.imdb?.vote_average || movie.imdbRating,
            votes: sd.tmdb?.vote_count || movie.votes,
          };
        }

        let tmdbId = currentMovie.tmdbId ? parseInt(currentMovie.tmdbId) : null;
        let mediaType: "movie" | "tv" = "movie";

        if (!tmdbId) {
          // Search for movie in TMDB
          const yearMatch = currentMovie.year ? parseInt(currentMovie.year) : undefined;
          const cleanName = (name: string) => name.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").trim();
          const searchName = cleanName(currentMovie.title);
          const searchOrigin = currentMovie.originalTitle ? cleanName(currentMovie.originalTitle) : "";

          let tmdbSearch = await searchTMDBMovie(searchName, yearMatch);
          if (!tmdbSearch && searchOrigin) {
            tmdbSearch = await searchTMDBMovie(searchOrigin, yearMatch);
          }
          if (!tmdbSearch) {
            tmdbSearch = await searchTMDBMovie(searchName);
          }
          
          if (tmdbSearch) {
            tmdbId = tmdbSearch.id;
            mediaType = tmdbSearch.media_type;
          }
        }

        if (!tmdbId) return currentMovie;

        // Get full details for genres and real fields
        const details = await getTMDBMovieDetails(tmdbId, mediaType);
        if (!details) return currentMovie;

        const imdbId = details.external_ids?.imdb_id || currentMovie.imdbId;
        const realImdbRating = imdbId ? await getIMDbRating(imdbId).catch(() => null) : null;

        return {
          ...currentMovie,
          originalTitle: details.original_title || details.original_name || currentMovie.originalTitle,
          overview: details.overview || currentMovie.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          imdbRating: realImdbRating || currentMovie.imdbRating || 0,
          tmdbRating: details.vote_average || currentMovie.tmdbRating || 0,
          votes: details.vote_count || currentMovie.votes || 0,
          // Optimization: Use TMDB backdrop for hero slider if available
          thumbUrl: details.backdrop_path ? (getTMDBImageUrl(details.backdrop_path) || currentMovie.thumbUrl) : currentMovie.thumbUrl,
          posterUrl: details.poster_path ? (getTMDBImageUrl(details.poster_path) || currentMovie.posterUrl) : currentMovie.posterUrl,
        };
      } catch (error) {
        console.error(`Error enriching movie ${movie.title}:`, error);
        return currentMovie;
      }
    })
  );

  return enriched;
}
