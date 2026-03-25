
const TMDB_API_KEY = "3a0028d7065050f2249e29a988d494a8"; // Hardcoded from tmdb.ts
async function test() {
  const res = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&language=vi-VN`).then(r => r.json());
  res.results.slice(0, 10).forEach(m => {
    console.log(`ID: ${m.id}, Title: ${m.title || m.name}, Original: ${m.original_title || m.original_name}`);
  });
}
test();
