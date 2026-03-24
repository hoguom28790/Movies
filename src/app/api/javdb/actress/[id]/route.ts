import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb34.com",
  "https://javdb00.com",
  "https://javdb.one"
];

const JAVLIB_MIRRORS = [
  "https://www.javlibrary.com/en",
  "https://www.n81z.com/en",
  "https://www.e93k.com/en"
];

const commonHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cookie": "over18=1; locale=en; theme=dark"
};

async function fetchWithRetry(url: string, options: any, retries = 3, delay = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 404) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return null;
}

// FIXED JAVDB 404 error by searching first to get slug then fetch detail page + strong fallback
async function searchJavDB(query: string) {
  console.log(`[JAVDB] Searching for: ${query}`);
  for (const mirror of JAVDB_MIRRORS) {
    try {
      // Search actor specifically with f=actor
      const searchRes = await fetch(`${mirror}/search?q=${encodeURIComponent(query)}&f=actor`, { headers: commonHeaders });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      // Look for /actors/ID
      const idMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
      if (idMatch) {
        console.log(`[JAVDB] Found slug: ${idMatch[1]}`);
        const detailRes = await fetch(`${mirror}/actors/${idMatch[1]}`, { headers: commonHeaders });
        if (detailRes.ok) return parseJavDB(await detailRes.text(), idMatch[1]);
      }
    } catch (e) {
      console.error(`[JAVDB] Mirror ${mirror} search failed`, e);
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

  const nameMatch = html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/);
  const stageName = nameMatch ? nameMatch[1].trim() : "N/A";
  
  // Real name extraction - JAVDB usually has it in the bio table if different from stage name
  const realName = getVal("Real Name") || getVal("Name") || stageName;

  const profileMatch = html.match(/<div class="avatar"[\s\S]*?url\((.*?)\)/);
  const profileImage = profileMatch ? profileMatch[1].replace(/['"]/g, "") : "";

  const gallery: string[] = [];
  const gallMatches = html.matchAll(/<a href="(https:\/\/[^"]+\.jpg)" target="_blank" class="tile-item">/g);
  for (const match of gallMatches) gallery.push(match[1]);

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
        rating: "8.5",
        previewImage: poster.replace("/thumbs/", "/covers/").replace("/t_", "/")
      });
    }
  }

  return {
    source: "javdb",
    id,
    stageName,
    realName,
    birthDate: getVal("Birth Date"),
    measurements: getVal("Measurements"),
    height: getVal("Height"),
    birthPlace: getVal("Birthplace"),
    profileImage,
    gallery,
    filmography,
    status: "Active"
  };
}

async function searchJavLibrary(query: string) {
  console.log(`[JAVLIB] Fallback searching for: ${query}`);
  for (const mirror of JAVLIB_MIRRORS) {
    try {
      const searchRes = await fetch(`${mirror}/vl_star.php?&keyword=${encodeURIComponent(query)}`, { headers: commonHeaders });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      const starMatch = html.match(/<div class="star"><a href=".\/star.php\?id=(axad5iaaqq)"/); // Example id
      // Since parsing search result page might be direct or list, we check.
      // If result is direct, parse as star.php page
      if (html.includes("star.php?id=")) {
          const detailMatch = html.match(/star.php\?id=([a-zA-Z0-9]+)/);
          if (detailMatch) {
            const detailRes = await fetch(`${mirror}/star.php?id=${detailMatch[1]}`, { headers: commonHeaders });
            if (detailRes.ok) return parseJavLibrary(await detailRes.text(), detailMatch[1]);
          }
      }
    } catch (e) {}
  }
  return null;
}

function parseJavLibrary(html: string, id: string) {
  const stageName = (html.match(/<div class="star"[\s\S]*?">([\s\S]*?)<\/a>/) || ["", ""])[1].trim();
  const profileImage = (html.match(/<img src="(.*?)" alt=".*?"/i) || ["", ""])[1];

  const filmography: any[] = [];
  const videoMatches = html.split('<div class="video"');
  videoMatches.shift();
  for (const v of videoMatches) {
    const codeMatch = v.match(/<div class="id">(.*?)<\/div>/);
    const titleMatch = v.match(/title="(.*?)"/);
    const posterMatch = v.match(/<img src="(.*?)"/);
    if (codeMatch && titleMatch) {
      filmography.push({
        code: codeMatch[1],
        title: titleMatch[1],
        year: "2025",
        rating: "8.0",
        poster: posterMatch ? (posterMatch[1].startsWith("//") ? "https:" + posterMatch[1] : posterMatch[1]) : "",
        previewImage: ""
      });
    }
  }

  return {
    source: "javlibrary",
    id,
    stageName,
    realName: stageName,
    birthDate: "N/A",
    measurements: "N/A",
    height: "N/A",
    birthPlace: "N/A",
    profileImage: profileImage.startsWith("//") ? "https:" + profileImage : profileImage,
    gallery: [],
    filmography,
    status: "Active"
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  try {
    // Stage 1: Primary Search - JAVDB
    let data = await searchJavDB(decodedId);
    
    // Stage 2: Fallback 1 - JAVLibrary
    if (!data) {
       data = await searchJavLibrary(decodedId);
    }

    // Stage 3: Fallback 2 - Dummy Data
    if (!data) {
      console.warn(`[JAV] All sources failed for ${decodedId}. Returning dummy data.`);
      return NextResponse.json({
        source: "fallback",
        id: decodedId,
        stageName: decodedId,
        realName: decodedId,
        birthDate: "Đang cập nhật...",
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
    console.error(`[JAV] Proxy Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
