import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = ["https://javdb.com", "https://javdb34.com", "https://javdb00.com"];
const JAVLIB_MIRRORS = ["https://www.javlibrary.com/en", "https://www.n81z.com/en"];

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Cookie": "over18=1; locale=en; theme=dark"
};

// FIXED JAVDB actress scraper: search first → get slug → fetch detail
async function searchJavDB(name: string) {
  console.log(`[JAVDB FETCH] Step 1: Searching for ${name}`);
  for (const mirror of JAVDB_MIRRORS) {
    try {
      const searchRes = await fetch(`${mirror}/search?q=${encodeURIComponent(name)}&f=actor`, { headers, signal: AbortSignal.timeout(5000) });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      
      // Select the first actor slug
      const slugMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
      if (slugMatch) {
         const slug = slugMatch[1];
         console.log(`[JAVDB FETCH] Step 2: Found slug ${slug}. Fetching detail...`);
         const detailRes = await fetch(`${mirror}/actors/${slug}`, { headers, signal: AbortSignal.timeout(5000) });
         if (detailRes.ok) return parseJavDB(await detailRes.text(), slug);
      }
    } catch (e) {
      console.warn(`[JAVDB FETCH] Mirror ${mirror} failed:`, e);
    }
  }
  return null;
}

function parseJavDB(html: string, id: string) {
  const getVal = (label: string) => {
    const regex = new RegExp(`<strong>${label}:<\\/strong>\\s*<span class="value">(.*?)<\\/span>`, "i");
    const match = html.match(regex);
    return match ? match[1].trim() : "N/A";
  };

  const stageName = (html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/) || ["", "N/A"])[1].trim();
  const realName = getVal("Real Name") || getVal("Name") || stageName;
  const birthDate = getVal("Birth Date");
  const measurements = getVal("Measurements");
  const height = getVal("Height");
  const birthPlace = getVal("Birthplace");

  const profileMatch = html.match(/<div class="avatar"[\s\S]*?url\((.*?)\)/) || html.match(/<img class="avatar" src="(.*?)"/);
  const profileImage = profileMatch ? profileMatch[1].replace(/['"]/g, "") : "";

  // Gallery
  const gallery: string[] = [];
  const gallMatches = html.matchAll(/<a href="(https:\/\/[^"]+\.jpg)" target="_blank" class="tile-item">/g);
  for (const match of gallMatches) gallery.push(match[1]);

  // Filmography
  const filmography: any[] = [];
  const items = html.split('<div class="item">');
  items.shift();
  for (const item of items) {
    const code = (item.match(/<strong>(.*?)<\/strong>/) || ["", ""])[1];
    const title = (item.match(/<div class="video-title">(.*?)<\/div>/) || ["", ""])[1];
    const poster = (item.match(/<img src="(.*?)"/) || ["", ""])[1];
    const year = (item.match(/<div class="meta">(.*?)<\/div>/) || ["", ""])[1];
    if (code && title) {
      filmography.push({
        code,
        title,
        year: year.split(",")[0].trim(),
        poster,
        rating: (item.match(/<span class="score">(.*?)<\/span>/) || ["", "8.5"])[1],
      });
    }
  }

  return { source: "javdb", id, stageName, realName, birthDate, measurements, height, birthPlace, profileImage, gallery, filmography, status: "Active" };
}

async function searchJavLibrary(name: string) {
  console.log(`[JAVLIB FETCH] Fallback Search: Searching for ${name}`);
  for (const mirror of JAVLIB_MIRRORS) {
    try {
      const searchRes = await fetch(`${mirror}/vl_star.php?&keyword=${encodeURIComponent(name)}`, { headers, signal: AbortSignal.timeout(5000) });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      const idMatch = html.match(/star\.php\?id=([a-zA-Z0-9]+)/);
      if (idMatch) {
         const id = idMatch[1];
         const detailRes = await fetch(`${mirror}/star.php?id=${id}`, { headers, signal: AbortSignal.timeout(5000) });
         if (detailRes.ok) return parseJavLibrary(await detailRes.text(), id);
      }
    } catch {}
  }
  return null;
}

function parseJavLibrary(html: string, id: string) {
  const stageName = (html.match(/<div class="star">[\s\S]*?">([\s\S]*?)<\/a>/) || ["", "N/A"])[1].trim();
  const profileImage = (html.match(/<img src="(.*?)" alt=".*?"/i) || ["", ""])[1].replace(/^\/\//, "https://");

  const filmography: any[] = [];
  const videoMatches = html.split('<div class="video"');
  videoMatches.shift();
  for (const v of videoMatches) {
    const code = (v.match(/<div class="id">(.*?)<\/div>/) || ["", ""])[1];
    const title = (v.match(/title="(.*?)"/) || ["", ""])[1];
    const poster = (v.match(/<img src="(.*?)"/) || ["", ""])[1].replace(/^\/\//, "https://");
    if (code && title) {
      filmography.push({ code, title, year: "N/A", rating: "8.0", poster });
    }
  }

  return { source: "javlibrary", id, stageName, realName: stageName, birthDate: "N/A", measurements: "N/A", height: "N/A", birthPlace: "N/A", profileImage, gallery: [], filmography, status: "Active" };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedName = decodeURIComponent(id);

  try {
    let data = await searchJavDB(decodedName);
    if (!data) data = await searchJavLibrary(decodedName);

    if (!data) {
      return NextResponse.json({
        source: "fallback",
        id: decodedName,
        stageName: decodedName,
        realName: decodedName,
        birthDate: "N/A",
        measurements: "N/A",
        height: "N/A",
        birthPlace: "N/A",
        profileImage: "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe577334c25c13f68ea4431354011c1e4d69771fe0512f300c6d9c6239091b.svg",
        gallery: [],
        filmography: [],
        status: "Đang cập nhật dữ liệu diễn viên..."
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
