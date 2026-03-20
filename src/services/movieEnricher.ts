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
            overview: (sd.content || sd.description || movie.overview)?.replace(/<[^>]*>/g, ''),
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
          const searchName = currentMovie.title;
          const searchOrigin = currentMovie.originalTitle || "";

          // Exhaustive Search Fallbacks
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
          }
        }

        if (!tmdbId) return currentMovie;

        // Get full details for genres and real fields
        const details = await getTMDBMovieDetails(tmdbId, mediaType);
        if (!details) return currentMovie;
 
        const imdbId = details.external_ids?.imdb_id || currentMovie.imdbId;
        const realImdbRating = imdbId ? await getIMDbRating(imdbId).catch(() => null) : null;
 
        // Final Merge: Prioritize Source API ratings (from v1) over fetched ones
        return {
          ...currentMovie,
          tmdbId: currentMovie.tmdbId || details?.id?.toString() || "",
          imdbId: currentMovie.imdbId || details?.external_ids?.imdb_id || "",
          tmdbRating: currentMovie.tmdbRating || details?.vote_average || 0,
          imdbRating: currentMovie.imdbRating || realImdbRating || 0,
          votes: currentMovie.votes || details?.vote_count || 0,
          posterUrl: (details?.poster_path ? getTMDBImageUrl(details.poster_path, 'w780') : (currentMovie.posterUrl || currentMovie.thumbUrl)) || "",
          thumbUrl: (details?.backdrop_path ? getTMDBImageUrl(details.backdrop_path, 'w1280') : (currentMovie.thumbUrl || currentMovie.posterUrl)) || "",
          genres: currentMovie.genres || details?.genres?.map((g: any) => g.name) || [],
          year: currentMovie.year || details?.release_date?.split("-")[0] || details?.first_air_date?.split("-")[0] || "",
          title: currentMovie.title || details?.title || details?.name || "",
        };
      } catch (error) {
        console.error(`Error enriching movie ${movie.slug}:`, error);
        return movie;
      }
    })
  );

  return enriched;
}
