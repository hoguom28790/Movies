
async function test() {
  const providers = [
    "https://phimapi.com/v1/api/phim/chu-thuat-hoi-chien-tu-diet-hoi-du",
    "https://ophim1.com/v1/api/phim/chu-thuat-hoi-chien-tu-diet-hoi-du",
    "https://phim.nguonc.com/api/film/chu-thuat-hoi-chien-tu-diet-hoi-du"
  ];
  
  for (const url of providers) {
    try {
      console.log(`Checking ${new URL(url).hostname}...`);
      const res = await fetch(url).then(r => r.json());
      const eps = res.episodes || res.data?.episodes || [];
      console.log(`- Episodes servers: ${eps.length}`);
      if (eps.length > 0) {
        eps.forEach(s => {
          console.log(`  - Server: ${s.server_name || s.name}, Links: ${s.server_data?.length || s.items?.length || 0}`);
        });
      }
    } catch (e) {
      console.error(`- Error: ${e.message}`);
    }
  }
}
test();
