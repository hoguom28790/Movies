import { Movie } from "@/types/movie";

/**
 * Utility to identify if a movie item is just a trailer, coming soon, or placeholder.
 */
export const isTrailer = (m: Partial<Movie> | any): boolean => {
  const s = (m.status || m.episode_current || m.episodeCurrent || "").toLowerCase();
  const q = (m.quality || "").toLowerCase();
  const t = (m.title || "").toLowerCase();
  const sl = (m.slug || "").toLowerCase();
  const o = (m.overview || "").toLowerCase();

  return (
    s.includes("trailer") ||
    q.includes("trailer") ||
    t.includes("trailer") ||
    sl.includes("trailer") ||
    o.includes("xem trailer") ||
    s.startsWith("0/") ||
    s === "0" ||
    s.includes("tập 0") ||
    s.includes("coming soon") ||
    s.includes("sắp chiếu") ||
    s.includes("chưa phát sóng")
  );
};

/**
 * Normalizes movie data for UI components.
 */
export const normalizeMovieMetadata = (movie: Movie) => {
  return {
    ...movie,
    rating: movie.imdbRating || movie.tmdbRating || 8.5,
    displayQuality: movie.quality?.toUpperCase() || "HD",
    isSeries: movie.type === "series" || !!(movie.episodeCurrent && movie.episodeTotal),
    displayStatus: movie.episodeCurrent && movie.episodeTotal 
      ? `${movie.episodeCurrent}/${movie.episodeTotal}` 
      : movie.status || "Full"
  };
};
