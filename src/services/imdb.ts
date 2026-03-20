export interface IMDbTitle {
  id: string;
  aggregateRating: {
    ratingValue: number;
    ratingCount: number;
  };
}
 
export async function getIMDbRating(imdbId: string): Promise<number | null> {
  if (!imdbId) return null;
  
  try {
    const url = `https://www.imdb.com/title/${imdbId}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // IMDb includes a JSON-LD script tag with movie metadata
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!jsonLdMatch) return null;
    
    const data = JSON.parse(jsonLdMatch[1]);
    
    // Handle both single objects and arrays
    const movieData = Array.isArray(data) ? data.find(item => item.aggregateRating) : data;
    
    return movieData?.aggregateRating?.ratingValue || null;
  } catch (error) {
    console.error("IMDb Scraping Error:", error);
    return null;
  }
}
