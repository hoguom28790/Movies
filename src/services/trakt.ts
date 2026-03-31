import { HistoryEntry } from "@/types/database";

const TRAKT_API_URL = "https://api.trakt.tv";
const CLIENT_ID = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID || "";

export async function pushHistoryToTrakt(accessToken: string, history: HistoryEntry[]) {
  // Trakt can accept just the title to fuzzy match the movie
  const movies = history.map(h => ({
    title: h.movieTitle,
    watched_at: new Date(h.updatedAt).toISOString()
  }));

  try {
    const res = await fetch(`${TRAKT_API_URL}/sync/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ movies })
    });
    
    if (!res.ok) {
        console.error("Trakt Push Failed:", await res.text());
        return false;
    }
    return true;
  } catch (error) {
    console.error("Trakt Push Error:", error);
    return false;
  }
}

export async function pushSingleMovieToTrakt(accessToken: string, movieTitle: string) {
  try {
    const res = await fetch(`${TRAKT_API_URL}/sync/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        movies: [{ title: movieTitle, watched_at: new Date().toISOString() }]
      })
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

export async function getTraktRating(title: string, year?: number) {
  try {
    const query = year ? `${title} ${year}` : title;
    const searchRes = await fetch(`${TRAKT_API_URL}/search/movie?query=${encodeURIComponent(query)}`, {
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID
      }
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const movie = searchData[0]?.movie;
    if (!movie?.ids?.trakt) return null;

    const ratingRes = await fetch(`${TRAKT_API_URL}/movies/${movie.ids.trakt}/ratings`, {
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": CLIENT_ID
      }
    });

    if (!ratingRes.ok) return null;
    const ratingData = await ratingRes.json();
    return {
      rating: ratingData.rating,
      votes: ratingData.votes
    };
  } catch (error) {
    console.error("Trakt Rating Error:", error);
    return null;
  }
}
