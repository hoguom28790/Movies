import { NextRequest, NextResponse } from "next/server";

// Mirror domains used by top scrapers like jpn_r18_api to bypass restrictions
const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb00.com",
  "https://javdb34.com",
  "https://javdb.one"
];

async function fetchFromMirrors(path: string) {
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
    "Referer": "https://javdb.com/"
  };

  for (const mirror of JAVDB_MIRRORS) {
    try {
      const url = `${mirror}${path}`;
      const res = await fetch(url, { headers: commonHeaders, next: { revalidate: 3600 } });
      if (res.ok) return { html: await res.text(), base: mirror };
    } catch (e) {
      console.warn(`Mirror ${mirror} failed, trying next...`);
    }
  }
  throw new Error("All mirrors failed to respond");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const { html, base } = await fetchFromMirrors(`/actors/${id}`);

    // 1. Scrape Biographical Information (Using jpn_r18_api selectors)
    const info: any = {};
    
    // Name
    const nameMatch = html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/);
    info.name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : "Unknown";

    // Profile Image
    const avatarMatch = html.match(/<div class="avatar" style="background-image: url\((.*?)\)/);
    info.profilePic = avatarMatch ? avatarMatch[1] : "";

    // Detailed Stats (Parsing panel-block style)
    const statsMatches = html.matchAll(/<p class="is-size-7">([\s\S]*?): ([\s\S]*?)<\/p>/g);
    for (const match of statsMatches) {
      const key = match[1].trim();
      const value = match[2].replace(/<[^>]+>/g, '').trim();
      
      if (key === "生日" || key.toLowerCase().includes("birthday")) info.birthday = value;
      if (key === "身高" || key.toLowerCase().includes("height")) info.height = value;
      if (key === "三圍" || key.toLowerCase().includes("measurements")) info.measurements = value;
      if (key === "出生地" || key.toLowerCase().includes("birthplace")) info.birthPlace = value;
    }

    // 2. Filmography (Robust block-based parsing)
    const filmography: any[] = [];
    // jpn_r18_api often looks for movie-list or item grid
    const movieBlocks = html.split(/<div class="item">|<div class="grid-item">/);
    movieBlocks.shift();

    for (const block of movieBlocks) {
      const idMatch = block.match(/href="\/v\/([a-zA-Z0-9]+)"/);
      const posterMatch = block.match(/<img (?:lazy-)?src="(.*?)"/);
      const uidMatch = block.match(/class="uid">([\s\S]*?)<\/div>|<strong>([\s\S]*?)<\/strong>/);
      const titleMatch = block.match(/class="video-title">([\s\S]*?)<\/div>/);
      const ratingMatch = block.match(/class="value">([\d\.-]+)<\/span>/);
      const dateMatch = block.match(/class="meta">([\d-]+)<\/div>/);

      if (idMatch && (posterMatch || uidMatch)) {
         const code = uidMatch ? (uidMatch[1] || uidMatch[2]).replace(/<[^>]+>/g, '').trim() : "N/A";
         const movieTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(code, '').trim() : "Untitled";
         
         filmography.push({
           id: idMatch[1],
           poster: posterMatch ? posterMatch[1] : "",
           code: code,
           title: movieTitle,
           rating: ratingMatch ? ratingMatch[1] : "N/A",
           date: dateMatch ? dateMatch[1] : "N/A",
           link: `${base}/v/${idMatch[1]}`
         });
      }
    }

    // 3. Gallery (Preview images)
    const gallery: string[] = [];
    const galleryMatches = html.matchAll(/<a href="(.*?)" data-fancybox="gallery">/g);
    for (const match of galleryMatches) {
      if (match[1] && !gallery.includes(match[1])) {
        gallery.push(match[1]);
      }
    }

    // Fallback Gallery
    if (gallery.length === 0 && filmography.length > 0) {
      filmography.slice(0, 10).forEach(m => { if (m.poster) gallery.push(m.poster); });
    }

    return NextResponse.json({
      id,
      ...info,
      gallery,
      filmography
    });
  } catch (error) {
    console.error("JAVDB Sync Error:", error);
    return NextResponse.json({ error: "Failed to scrape from any mirror" }, { status: 500 });
  }
}
