import { Movie } from "@/types/movie";
import { searchTMDBMovie, getTMDBMovieDetails, getTMDBImageUrl } from "./tmdb";

export async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
  const { getIMDbRating } = await import("./imdb");

  const enriched = await Promise.all(
    movies.map(async (movie) => {
      try {
        let tmdbId = movie.tmdbId ? parseInt(movie.tmdbId) : null;
        let mediaType: "movie" | "tv" = "movie";

        if (!tmdbId) {
          // Search for movie in TMDB
          const yearMatch = movie.year ? parseInt(movie.year) : undefined;
          const cleanName = (name: string) => name.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").trim();
          const searchName = cleanName(movie.title);
          const searchOrigin = movie.originalTitle ? cleanName(movie.originalTitle) : "";

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

        if (!tmdbId) return movie;

        // Get full details for genres and real fields
        const details = await getTMDBMovieDetails(tmdbId, mediaType);
        if (!details) return movie;

        const imdbId = details.external_ids?.imdb_id || movie.imdbId;
        const realImdbRating = imdbId ? await getIMDbRating(imdbId).catch(() => null) : null;

        return {
          ...movie,
          originalTitle: details.original_title || details.original_name || movie.originalTitle,
          overview: details.overview || movie.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          imdbRating: realImdbRating || movie.imdbRating || 0,
          tmdbRating: details.vote_average || movie.tmdbRating || 0,
          votes: details.vote_count || movie.votes || 0,
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
