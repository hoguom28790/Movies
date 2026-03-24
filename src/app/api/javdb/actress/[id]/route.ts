import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = ["https://javdb.com", "https://javdb34.com", "https://javdb00.com", "https://javdb.one"];
const JAVLIB_MIRRORS = ["https://www.javlibrary.com/en", "https://www.n81z.com/en", "https://www.e93k.com/en"];

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Cookie": "over18=1; locale=en; theme=dark"
};

// IMPROVED: Combined Scraper (Bio from JavLib, Movies from JAVDB)
async function fetchActressData(name: string) {
  let javdbData: any = null;
  let javlibData: any = null;

  // 1. Fetch from JAVDB for high-quality Gallery and Filmography
  for (const mirror of JAVDB_MIRRORS) {
    try {
      const searchRes = await fetch(`${mirror}/search?q=${encodeURIComponent(name)}&f=actor`, { headers, signal: AbortSignal.timeout(6000) });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      
      // Target the specific actor box to avoid sidebar/trending links
      const actorMatch = html.match(/<a href="\/actors\/([a-zA-Z0-9]+)"[^>]*class="box"[^>]*>/) || html.match(/\/actors\/([a-zA-Z0-9]+)/);
      if (actorMatch) {
         const slug = actorMatch[1];
         const detailRes = await fetch(`${mirror}/actors/${slug}`, { headers, signal: AbortSignal.timeout(6000) });
         if (detailRes.ok) javdbData = parseJavDB(await detailRes.text(), slug);
         if (javdbData) break;
      }
    } catch (e) {
      console.warn(`[JAVDB] Mirror ${mirror} failed:`, e);
    }
  }

  // 2. Fetch from JavLibrary for reliable Bio Stats (Measurements, Birthdate)
  for (const mirror of JAVLIB_MIRRORS) {
    try {
      const searchUrl = `${mirror}/vl_star.php?&keyword=${encodeURIComponent(name)}`;
      const searchRes = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(6000) });
      if (!searchRes.ok) continue;
      const html = await searchRes.text();
      const idMatch = html.match(/star\.php\?id=([a-zA-Z0-9]+)/);
      if (idMatch) {
         const id = idMatch[1];
         const detailRes = await fetch(`${mirror}/star.php?id=${id}`, { headers, signal: AbortSignal.timeout(6000) });
         if (detailRes.ok) javlibData = parseJavLibrary(await detailRes.text(), id);
         if (javlibData) break;
      }
    } catch {}
  }

  // Merge Data
  if (!javdbData && !javlibData) return null;

  const final = {
    source: javdbData ? "javdb" : "javlibrary",
    id: javdbData?.id || javlibData?.id,
    stageName: javdbData?.stageName || javlibData?.stageName || name,
    realName: javlibData?.realName || javdbData?.realName || name,
    birthDate: javlibData?.birthDate && javlibData.birthDate !== "N/A" ? javlibData.birthDate : (javdbData?.birthDate || "Đang cập nhật..."),
    measurements: javlibData?.measurements && javlibData.measurements !== "N/A" ? javlibData.measurements : (javdbData?.measurements || "N/A"),
    height: javlibData?.height && javlibData.height !== "N/A" ? javlibData.height : (javdbData?.height || "N/A"),
    birthPlace: javdbData?.birthPlace || javlibData?.birthPlace || "N/A",
    profileImage: javdbData?.profileImage || javlibData?.profileImage || "",
    gallery: javdbData?.gallery || [],
    filmography: javdbData?.filmography || javlibData?.filmography || [],
    status: "Active"
  };

  return final;
}

function parseJavDB(html: string, id: string) {
  const getVal = (label: string) => {
    const regex = new RegExp(`<strong>${label}:<\\/strong>\\s*<span class="value">(.*?)<\\/span>`, "i");
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  };

  const stageName = (html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/) || ["", "N/A"])[1].trim();
  const realName = getVal("Real Name") || getVal("Name") || stageName;
  const birthDate = getVal("Birth Date");
  const measurements = getVal("Measurements");
  const height = getVal("Height");
  const birthPlace = getVal("Birthplace");

  const profileMatch = html.match(/<div class="avatar"[\s\S]*?url\((.*?)\)/) || html.match(/<img class="avatar" src="(.*?)"/);
  let profileImage = profileMatch ? profileMatch[1].replace(/['"]/g, "") : "";
  if (profileImage.startsWith("//")) profileImage = "https:" + profileImage;

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
        code, title, year: year.split(",")[0].trim(),
        poster: poster.startsWith("//") ? "https:" + poster : poster,
        rating: (item.match(/<span class="score">(.*?)<\/span>/) || ["", "8.5"])[1]
      });
    }
  }

  return { id, stageName, realName, birthDate, measurements, height, birthPlace, profileImage, gallery, filmography };
}

function parseJavLibrary(html: string, id: string) {
  const stageName = (html.match(/<div class="star">[\s\S]*?">([\s\S]*?)<\/a>/) || ["", "N/A"])[1].trim();
  const profileImage = (html.match(/<img src="(.*?)" alt=".*?"/i) || ["", ""])[1].replace(/^\/\//, "https://");
  
  const getStat = (label: string) => {
    const regex = new RegExp(`${label}:<\\/td>\\s*<td>(.*?)<\\/td>`, "i");
    const match = html.match(regex);
    return match ? match[1].trim() : "N/A";
  };

  const birthDate = getStat("Birthday");
  const measurements = getStat("Measurements");
  const height = getStat("Height");

  const filmography: any[] = [];
  const vids = html.split('<div class="video"');
  vids.shift();
  for (const v of vids) {
    const code = (v.match(/<div class="id">(.*?)<\/div>/) || ["", ""])[1];
    const title = (v.match(/title="(.*?)"/) || ["", ""])[1];
    const poster = (v.match(/<img src="(.*?)"/) || ["", ""])[1].replace(/^\/\//, "https://");
    if (code && title) filmography.push({ code, title, year: "N/A", rating: "8.0", poster });
  }

  return { id, stageName, realName: stageName, birthDate, measurements, height, profileImage, filmography };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedName = decodeURIComponent(id);

  try {
    const data = await fetchActressData(decodedName);

    if (!data) {
      return NextResponse.json({
        source: "fallback",
        id: decodedName,
        stageName: decodedName,
        realName: decodedName,
        birthDate: "Đang cập nhật...",
        measurements: "N/A",
        height: "N/A",
        birthPlace: "N/A",
        profileImage: "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe577334c25c13f68ea4431354011c1e4d69771fe0512f300c6d9c6239091b.svg",
        gallery: [],
        filmography: [],
        status: "Dữ liệu đang được đồng bộ..."
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
