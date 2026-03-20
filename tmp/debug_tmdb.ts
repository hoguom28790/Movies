import { searchTMDBMovie, getTMDBMovieDetails } from "./src/services/tmdb";
 
async function debug() {
  const titles = [
    "Watson",
    "Bác Sĩ Watson",
    "Watson (Season 1)",
    "Watson (Phần 1)"
  ];
  
  for (const title of titles) {
    console.log(`\nSearching for: ${title}`);
    const result = await searchTMDBMovie(title, 2025);
    console.log("Result (2025):", result ? { id: result.id, title: result.title || result.name, type: result.media_type } : "Not found");
    
    if (!result) {
      const resultNoYear = await searchTMDBMovie(title);
      console.log("Result (any year):", resultNoYear ? { id: resultNoYear.id, title: resultNoYear.title || resultNoYear.name, type: resultNoYear.media_type } : "Not found");
    }
  }
}
 
debug();
