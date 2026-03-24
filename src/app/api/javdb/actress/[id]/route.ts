import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = [
  "https://javdb.com", 
  "https://javdb36.com", 
  "https://javdb00.com", 
  "https://jav34.com"
];

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
  "Cookie": "over18=1; locale=en; theme=dark"
};

/**
 * FINAL FIX JAVDB actress scraper with search → slug → detail parsing + detailed console logs
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = decodeURIComponent(id);
  
  console.log("--- JAVDB SCRAPER START ---");
  console.log("Searching for:", name);

  try {
    let slug = null;
    let detailHtml = "";
    let usedMirror = "";

    // 1. Search for Actress Slug
    for (const mirror of JAVDB_MIRRORS) {
      try {
        const searchUrl = `${mirror}/search?q=${encodeURIComponent(name)}&f=actor`;
        const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(8000) });
        
        if (!searchRes.ok) {
          console.log(`Mirror ${mirror} search failed with status: ${searchRes.status}`);
          continue;
        }

        const html = await searchRes.text();
        // Regex to find first actress/actor link
        const slugMatch = html.match(/\/act(ors|ress)\/([a-zA-Z0-9]+)/);
        if (slugMatch) {
          slug = slugMatch[2];
          usedMirror = mirror;
          console.log("Found slug:", slug, "on mirror:", mirror);
          
          // 2. Fetch Detail Page
          const detailUrl = `${mirror}/actors/${slug}`;
          const detailRes = await fetch(detailUrl, { headers, signal: AbortSignal.timeout(8000) });
          if (detailRes.ok) {
            detailHtml = await detailRes.text();
            console.log("Fetched detail HTML length:", detailHtml.length);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Search error on mirror ${mirror}:`, err.message);
      }
    }

    if (!slug || !detailHtml) {
      console.log("Failed to find actress on all JAVDB mirrors. Returning dummy data.");
      return NextResponse.json(getDummyData(name));
    }

    // 3. Parse Data using robust Regex (simulating Cheerio logic)
    const data = parseData(detailHtml, slug, name);
    console.log("Parsed data:", {
      stageName: data.stageName,
      realName: data.realName,
      birthDate: data.birthDate,
      measurements: data.measurements,
      filmCount: data.filmography.length,
      galCount: data.gallery.length
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("CRITICAL SCRAPER ERROR:", error);
    return NextResponse.json(getDummyData(name));
  }
}

function parseData(html: string, slug: string, name: string) {
  // Selectors simulation
  const getField = (labels: string[]) => {
    for (const label of labels) {
      const regex = new RegExp(`<strong>${label}:<\\/strong>\\s*<span class="value">(.*?)<\\/span>`, "i");
      const match = html.match(regex);
      if (match) return match[1].trim();
    }
    return "Đang cập nhật";
  };

  const stageName = (html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || ["", name])[1].trim();
  
  const realName = getField(["Real Name", "Name", "本名"]);
  const birthDate = getField(["Birth Date", "Birthday", "生年月日"]);
  const measurements = getField(["Measurements", "スリーサイズ"]);
  const height = getField(["Height", "身長"]);
  const birthPlace = getField(["Birthplace", "出身地"]);

  const profileMatch = html.match(/<div class="avatar"[\s\S]*?url\((.*?)\)/) || html.match(/<img class="avatar" src="(.*?)"/);
  let profileImage = profileMatch ? profileMatch[1].replace(/['"]/g, "") : "/placeholder-actress.jpg";
  if (profileImage.startsWith("//")) profileImage = "https:" + profileImage;

  // Gallery
  const gallery: string[] = [];
  const galMatches = html.matchAll(/<a[^>]+href="(https:\/\/[^"]+\.(jpg|png|webp))"[^>]+target="_blank"[^>]+class="tile-item">/g);
  for (const m of galMatches) gallery.push(m[1]);
  
  // Alternative Gallery: preview-images or gallery classes
  if (gallery.length === 0) {
    const previewMatches = html.matchAll(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|png|webp))"[^>]+class="preview-image"/g);
    for (const m of previewMatches) gallery.push(m[1]);
  }

  // Filmography
  const filmography: any[] = [];
  const items = html.split('<div class="item">');
  items.shift();
  for (const item of items) {
    const code = (item.match(/<strong>([A-Z0-9-]+)<\/strong>/i) || ["", ""])[1];
    const title = (item.match(/<div class="video-title">([\s\S]*?)<\/div>/) || ["", ""])[1].trim();
    const poster = (item.match(/<img[^>]+src="(.*?)"/) || ["", ""])[1];
    const meta = (item.match(/<div class="meta">([\s\S]*?)<\/div>/) || ["", ""])[1];
    
    if (code && title) {
      filmography.push({
        code,
        title,
        year: meta.split(",")[0].trim() || "N/A",
        rating: (item.match(/<span class="score">([\s\S]*?)<\/span>/) || ["", "8.5"])[1],
        poster: poster.startsWith("//") ? "https:" + poster : poster,
        previewImage: poster.replace("/thumbs/", "/covers/").replace("/t_", "/")
      });
    }
  }

  // If gallery still empty, use posters
  const finalGallery = gallery.length > 0 ? gallery : filmography.slice(0, 10).map(f => f.poster);

  return {
    source: "javdb",
    id: slug,
    stageName,
    realName,
    birthDate,
    measurements,
    height,
    birthPlace,
    profileImage,
    gallery: finalGallery,
    filmography,
    status: "Active"
  };
}

function getDummyData(name: string) {
  return {
    source: "fallback",
    id: "dummy",
    stageName: name,
    realName: "Đang cập nhật",
    birthDate: "Đang cập nhật",
    measurements: "N/A",
    height: "N/A",
    birthPlace: "N/A",
    profileImage: "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe577334c25c13f68ea4431354011c1e4d69771fe0512f300c6d9c6239091b.svg",
    gallery: [],
    filmography: [],
    status: "Đang cập nhật dữ liệu diễn viên..."
  };
}
