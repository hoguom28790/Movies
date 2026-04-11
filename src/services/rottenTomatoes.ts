const BASE_URL = "https://rotten-tomatoes-api-clrb.onrender.com/api/v1";

export interface RTRating {
  imdbId: string;
  rtUrl: string;
  title: string;
  year: number;
  criticScore: number;
  audienceScore: number;
  criticRating: string;
  audienceRating: string;
}

export async function getRTRating(imdbId: string): Promise<RTRating | null> {
  if (!imdbId) return null;

  try {
    // This API is a community project from GitHub: SilverCrocus/rotten-tomatoes-api
    const response = await fetch(`${BASE_URL}/movie/${imdbId}`, {
      next: { revalidate: 86400 }, // Cache 24h
      signal: AbortSignal.timeout(2000),
      headers: {
        // If an API key is eventually required, it should be added here
        // For now, many community-run Render instances allow basic usage
      }
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("Rotten Tomatoes API Error:", error);
    return null;
  }
}
