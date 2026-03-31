const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || "6e198f9c";
const FANART_API_KEY = process.env.NEXT_PUBLIC_FANART_API_KEY || "dde98c854105192d7b04ad968e7d9d54";

export interface OMDbSearchResult {
  imdbID: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
}

/**
 * Searches OMDb for a movie and automatically fetches high-res Fanart backdrop if OMDb poster is found.
 */
export async function searchOMDbMovie(title: string, year?: number, type: "movie" | "tv" = "movie"): Promise<OMDbSearchResult | null> {
  try {
    const cleanTitle = title.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").replace(/Part\s+\d+/gi, "").trim();
    
    // 1. Fetch from OMDb API
    // We use "t=" instead of "s=" since t gives full details like Poster and imdbID instantly for exact match
    let url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(cleanTitle)}&type=${type === "tv" ? "series" : "movie"}`;
    if (year) url += `&y=${year}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.Response === "False" || !data.imdbID) return null;

    let poster = data.Poster && data.Poster !== "N/A" ? data.Poster : null;
    let backdrop = null;

    // 2. Fetch high-res imagery from Fanart.tv using the acquired imdbID
    try {
      const fanartRes = await fetch(`https://webservice.fanart.tv/v3/movies/${data.imdbID}?api_key=${FANART_API_KEY}`, { 
        next: { revalidate: 86400 } 
      });
      if (fanartRes.ok) {
        const faData = await fanartRes.json();
        if (faData.moviebackground && faData.moviebackground.length > 0) {
          backdrop = faData.moviebackground[0].url;
        }
        if (!poster && faData.movieposter && faData.movieposter.length > 0) {
          poster = faData.movieposter[0].url;
        }
      }
    } catch (e) {
      console.error("Fanart fetch error", e);
    }

    return {
      imdbID: data.imdbID,
      poster_path: poster,
      backdrop_path: backdrop,
      vote_average: data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : undefined,
    };
  } catch (error) {
    console.error("OMDb Search Error:", error);
    return null;
  }
}

/**
 * Fetches OMDb specific details (like ratings) using IMDb ID
 */
export async function getOMDbRatingById(imdbId: string): Promise<OMDbSearchResult | null> {
  if (!imdbId) return null;
  try {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.Response === "False") return null;

    return {
      imdbID: data.imdbID,
      poster_path: data.Poster !== "N/A" ? data.Poster : null,
      backdrop_path: null,
      vote_average: data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : undefined,
    };
  } catch (error) {
    console.error("OMDb ID Fetch Error:", error);
    return null;
  }
}

/**
 * Fallback to Unsplash if everything fails to ensure beautiful cards
 */
export function getFallbackPlaceholder(title: string) {
  // Returns a deterministic random blur or dark cinematic gradient placeholder
  const hash = title.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const sig = Math.abs(hash) % 1000;
  return `https://source.unsplash.com/random/500x750/?dark,movie,cinematic&sig=${sig}`;
}
