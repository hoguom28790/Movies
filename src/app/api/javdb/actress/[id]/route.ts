import { NextRequest, NextResponse } from "next/server";

const JAVDB_BASE = "https://javdb.com";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const detailUrl = `${JAVDB_BASE}/actors/${id}?locale=zh&theme=dark`;
    const res = await fetch(detailUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "over18=1; locale=zh",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from JAVDB. Status: ${res.status}`);
    }

    const html = await res.text();

    // 1. Scrape Biographical Information
    const info: any = {};
    
    // Name - Look for h2 title with class title is-4
    const nameMatch = html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/);
    info.name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : "Unknown";

    // Profile Image - Look for div class avatar
    const avatarMatch = html.match(/<div class="avatar" style="background-image: url\((.*?)\)/);
    info.profilePic = avatarMatch ? avatarMatch[1] : "";

    // Stats - Look for labels and values in points
    const statsMatches = html.matchAll(/<p class="is-size-7">([\s\S]*?): ([\s\S]*?)<\/p>/g);
    for (const match of statsMatches) {
      const key = match[1].trim();
      const value = match[2].replace(/<[^>]+>/g, '').trim();
      
      if (key === "生日" || key.includes("Birthday")) info.birthday = value;
      if (key === "身高" || key.includes("Height")) info.height = value;
      if (key === "三圍" || key.includes("Measurements")) info.measurements = value;
      if (key === "出生地" || key.includes("Birthplace")) info.birthPlace = value;
    }

    // 2. Filmography - Divide into individual item blocks for robust parsing
    const filmography: any[] = [];
    const movieBlocks = html.split(/<div class="item">|<div class="grid-item">/);
    movieBlocks.shift(); // Remove the part before the first item

    for (const block of movieBlocks) {
      // Each block contains one movie card
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
           link: `${JAVDB_BASE}/v/${idMatch[1]}`
         });
      }
    }

    // 3. Gallery - Preview images or posters from related content
    const gallery: string[] = [];
    // JAVDB often has preview gallery images with fancybox
    const galleryMatches = html.matchAll(/<a href="(.*?)" data-fancybox="gallery">/g);
    for (const match of galleryMatches) {
      if (match[1] && !gallery.includes(match[1])) {
        gallery.push(match[1]);
      }
    }

    // Secondary gallery search (common posters/thumbnails as a fallback if no explicit gallery)
    if (gallery.length === 0 && filmography.length > 0) {
      filmography.slice(0, 10).forEach(m => {
        if (m.poster) gallery.push(m.poster);
      });
    }

    return NextResponse.json({
      id,
      ...info,
      gallery,
      filmography
    });
  } catch (error) {
    console.error("JAVDB Actress Detail Internal Error:", error);
    return NextResponse.json({ error: "Failed to scrape details" }, { status: 500 });
  }
}
