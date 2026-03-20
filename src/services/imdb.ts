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
    
    // Find aggregateRating in a more robust way (can be nested or in an array)
    const findRating = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.aggregateRating) return obj.aggregateRating;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const r = findRating(item);
          if (r) return r;
        }
      }
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const r = findRating(obj[key]);
          if (r) return r;
        }
      }
      return null;
    };
    
    const ratingData = findRating(data);
    return ratingData?.ratingValue || null;
  } catch (error) {
    console.error("IMDb Scraping Error:", error);
    return null;
  }
}
