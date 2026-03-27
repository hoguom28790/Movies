
import { getMovieDetails } from "./src/services/api/index.js";

async function test() {
  const slugs = ["how-to-make-a-killing", "peaky-blinders-the-immortal-man"];
  for (const slug of slugs) {
    console.log(`Testing slug: ${slug}`);
    const res = await getMovieDetails(slug);
    if (!res) {
      console.log(`No results for ${slug}`);
      continue;
    }
    console.log(`Found ${res.sources.length} sources for ${slug}`);
    res.sources.forEach(s => {
      console.log(`Source: ${s.name} (${s.id})`);
      const eps = s.data.episodes || [];
      eps.forEach((serv, i) => {
        const items = serv.server_data || serv.items || [];
        console.log(`  Server ${i+1}: ${items.length} episodes`);
        items.forEach((item, j) => {
          console.log(`    Ep ${j+1}: ${item.name} - M3U8: ${!!item.link_m3u8}, Embed: ${!!item.link_embed}`);
        });
      });
    });
  }
}

test();
