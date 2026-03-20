const BASE_URL = "https://api.imdbapi.dev";

export interface IMDbTitle {
  id: string;
  aggregateRating: {
    ratingValue: number;
    ratingCount: number;
  };
  // other fields can be added if needed
}

export async function getIMDbRating(imdbId: string): Promise<number | null> {
  if (!imdbId) return null;
  
  try {
    const response = await fetch(`${BASE_URL}/titles/${imdbId}`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.aggregateRating?.ratingValue || null;
  } catch (error) {
    console.error("IMDb API Error:", error);
    return null;
  }
}
