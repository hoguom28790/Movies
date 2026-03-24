import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const JAVDB_MIRRORS = ["https://javdb.com", "https://javdb36.com", "https://javdb00.com", "https://jav34.com"];
const JAVLIB_MIRRORS = ["https://www.javlibrary.com/en", "https://www.n81z.com/en"];

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Cookie": "over18=1; locale=en; theme=dark"
};

/**
 * FINAL FIX JAVDB actress scraper with Cheerio parsing + detailed console logs
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = decodeURIComponent(id);
  
  console.log(`[SCRAPER] START - Searching for: ${name}`);

  try {
    let result = await searchJavDB(name);
    
    if (!result) {
      console.log(`[SCRAPER] JAVDB failed for ${name}. Trying JavLibrary fallback...`);
      result = await searchJavLibrary(name);
    }

    if (!result) {
      console.log(`[SCRAPER] ALL SOURCES FAILED for ${name}. Returning dummy data.`);
      return NextResponse.json(getDummyData(name));
    }

    console.log(`[SCRAPER] SUCCESS - Parsed ${result.stageName} from ${result.source}`);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`[SCRAPER] CRITICAL ERROR:`, error.message);
    return NextResponse.json(getDummyData(name));
  }
}

async function searchJavDB(name: string) {
  for (const mirror of JAVDB_MIRRORS) {
    try {
      console.log(`[JAVDB] Searching ${mirror}...`);
      const searchUrl = `${mirror}/search?q=${encodeURIComponent(name)}&f=actor`;
      const res = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      
      // Get first actress slug
      const slug = $(".item a, .actors a").first().attr("href")?.split("/").pop();
      if (!slug) continue;

      console.log(`[JAVDB] Found slug: ${slug}. Fetching detail...`);
      const detailUrl = `${mirror}/actors/${slug}`;
      const detailRes = await fetch(detailUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (!detailRes.ok) continue;

      const detailHtml = await detailRes.text();
      return parseJavDB(detailHtml, slug, name);
    } catch (err: any) {
      console.warn(`[JAVDB] Mirror ${mirror} failed: ${err.message}`);
    }
  }
  return null;
}

function parseJavDB(html: string, slug: string, fallbackName: string) {
  const $ = cheerio.load(html);
  
  const stageName = $(".title.is-4, h1").first().text().trim() || fallbackName;
  
  const getVal = (labels: string[]) => {
    let val = "N/A";
    $(".actor-section stong, strong").each((_, el) => {
      const labelText = $(el).text();
      if (labels.some(l => labelText.includes(l))) {
        val = $(el).next(".value").text().trim() || $(el).parent().text().replace(labelText, "").trim();
      }
    });
    return val;
  };

  const realName = getVal(["Real Name", "Name", "本名"]) || stageName;
  const birthDate = getVal(["Birth Date", "Birthday", "生年月日"]);
  const measurements = getVal(["Measurements"]) || getVal(["スリーサイズ"]);
  const height = getVal(["Height", "身長"]);
  const birthPlace = getVal(["Birthplace", "出身地"]);

  let profileImage = $(".avatar, .profile img").first().attr("src") || $(".avatar").css("background-image")?.replace(/url\(["']?(.*?)["']?\)/, "$1");
  if (profileImage?.startsWith("//")) profileImage = "https:" + profileImage;

  // Gallery
  const gallery: string[] = [];
  $(".tile-item, .preview-images a, .gallery a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.match(/\.jpg|\.png/)) gallery.push(href);
  });

  // Filmography
  const filmography: any[] = [];
  $(".item").each((_, el) => {
    const code = $(el).find("strong").first().text().trim();
    const title = $(el).find(".video-title, .title").text().trim();
    const poster = $(el).find("img").attr("src");
    const year = $(el).find(".meta, .date").text().split(",")[0].trim();
    const rating = $(el).find(".score, .rating").text().trim() || "8.5";

    if (code && title) {
      filmography.push({
        code,
        title,
        year,
        rating,
        poster: poster?.startsWith("//") ? "https:" + poster : poster,
        previewImage: poster?.replace("/thumbs/", "/covers/").replace("/t_", "/")
      });
    }
  });

  // If gallery empty, use posters as requested by previous patterns for completeness
  const finalGallery = gallery.length > 0 ? gallery : filmography.slice(0, 12).map(f => f.poster);

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

async function searchJavLibrary(name: string) {
  for (const mirror of JAVLIB_MIRRORS) {
    try {
      console.log(`[JAVLIB] Searching ${mirror}...`);
      const searchUrl = `${mirror}/vl_star.php?&keyword=${encodeURIComponent(name)}`;
      const res = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      
      const id = $("div.star a").first().attr("href")?.split("=").pop();
      if (!id) continue;

      const detailUrl = `${mirror}/star.php?id=${id}`;
      const detailRes = await fetch(detailUrl, { headers, signal: AbortSignal.timeout(8000) });
      if (!detailRes.ok) continue;

      return parseJavLibrary(await detailRes.text(), id);
    } catch {}
  }
  return null;
}

function parseJavLibrary(html: string, id: string) {
  const $ = cheerio.load(html);
  
  const stageName = $(".star h2").text().trim() || $(".star a").first().text().trim();
  const profileImage = $("#star_graffiti img").attr("src")?.replace(/^\/\//, "https://");

  const getBio = (label: string) => {
    return $(`.star table td:contains("${label}")`).next().text().trim() || "N/A";
  };

  const filmography: any[] = [];
  $(".video").each((_, el) => {
    const code = $(el).find(".id").text().trim();
    const title = $(el).find("img").attr("title");
    const poster = $(el).find("img").attr("src")?.replace(/^\/\//, "https://");
    if (code && title) {
      filmography.push({ code, title, year: "N/A", rating: "8.0", poster });
    }
  });

  return {
    source: "javlibrary",
    id,
    stageName,
    realName: stageName,
    birthDate: getBio("Birthday"),
    measurements: getBio("Measurements"),
    height: getBio("Height"),
    birthPlace: "N/A",
    profileImage,
    gallery: [],
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
    status: "Dữ liệu đang được cập nhật..."
  };
}
