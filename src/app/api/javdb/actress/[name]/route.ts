import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// FINAL FIX JAVDB actress scraper: search first → get slug → parse detail with real selectors + full debug logs
const JAVDB_MIRRORS = [
  "https://javdb34.com",
  "https://javdb35.com",
  "https://javdb36.com",
  "https://javdb00.com",
  "https://javdb.one",
  "https://javdb.com"
];

async function fetchFromMirrors(path: string) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
  };

  for (const mirror of JAVDB_MIRRORS) {
    try {
      const url = `${mirror}${path}`;
      const res = await fetch(url, { 
        headers: { ...headers, "Referer": mirror + "/" }, 
        next: { revalidate: 300 } 
      });
      
      if (res.ok) {
        const text = await res.text();
        // Skip challenge/parked pages
        if (text.includes("cf-browser-verification") || text.includes("choto.click") || text.length < 1500) {
           continue;
        }
        return { html: text, url: res.url, mirrorUsed: mirror };
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  console.log("[JAVDB] Searching for:", name);

  try {
    // 1. Search to get slug
    const searchRes = await fetchFromMirrors(`/search?q=${encodeURIComponent(name)}&f=actress`);
    let slug = "";

    if (searchRes) {
      if (searchRes.url.includes("/a/")) {
        slug = searchRes.url.split("/").pop()?.split("?")[0] || "";
      } else {
        const $search = cheerio.load(searchRes.html);
        const href = $search("a.item, .actress-item a, .actor-box a").filter((_, el) => {
          const h = $(el).attr("href");
          return typeof h === "string" && h.startsWith("/a/");
        }).first().attr("href");
        if (href) slug = href.replace("/a/", "");
      }
    }

    // Fallback slug if search fails but we want to try direct
    if (!slug) {
      slug = name.toLowerCase().replace(/\s+/g, "-");
    }

    console.log("[JAVDB] Found slug:", slug);

    // 2. Fetch detail page
    const detailRes = await fetchFromMirrors(`/a/${slug}`);
    if (!detailRes) throw new Error("Could not fetch detail page from any mirror");

    const html = detailRes.html;
    console.log("[JAVDB] Fetched detail HTML length:", html.length);

    const $ = cheerio.load(html);
    
    const parsedData: any = {
      source: "javdb",
      id: slug,
      stageName: $("h1.title, .title.is-4").first().text().trim() || name,
      realName: "Đang cập nhật",
      birthDate: "Đang cập nhật",
      measurements: "N/A",
      height: "N/A",
      birthPlace: "N/A",
      profileImage: $(".avatar img, .profile img").first().attr("src") || "",
      gallery: [],
      filmography: []
    };

    // Parse biographical details
    $(".panel-block, p.is-size-7").each((_, el) => {
      const text = $(el).text();
      const val = text.includes(":") ? text.split(":")[1].trim() : "";
      
      if (text.includes("Real Name") || text.includes("本名")) parsedData.realName = val;
      if (text.includes("Birthday") || text.includes("生年月日")) parsedData.birthDate = val;
      if (text.includes("Measurements") || text.includes("スリーサイズ")) parsedData.measurements = val;
      if (text.includes("Height") || text.includes("身長")) parsedData.height = val;
      if (text.includes("Birthplace") || text.includes("出身地")) parsedData.birthPlace = val;
    });

    // Gallery
    $(".preview-images img, .gallery img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("avatar")) {
        parsedData.gallery.push(src.startsWith("//") ? "https:" + src : src);
      }
    });

    // Filmography
    $(".movie-list .item, .grid-item").each((_, el) => {
      const $el = $(el);
      const code = $el.find(".uid, strong").first().text().trim();
      const title = $el.find(".video-title, .title").first().text().trim();
      const poster = $el.find("img").first().attr("src");
      const year = $el.find(".meta").first().text().split("-")[0].trim();
      const rating = $el.find(".value").first().text().trim();

      if (code && code !== parsedData.stageName) {
        parsedData.filmography.push({
          code,
          title: title.startsWith(code) ? title.replace(code, '').trim() : title,
          poster: poster?.startsWith("//") ? "https:" + poster : poster,
          year: year || "N/A",
          rating: rating || "N/A"
        });
      }
    });

    console.log("[JAVDB] Parsed data:", JSON.stringify(parsedData, null, 2));
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("[JAVDB] Error:", error.message);
    
    // Fallback dummy data as requested
    return NextResponse.json({
      source: "fallback",
      stageName: name,
      realName: "Đang cập nhật",
      birthDate: "Đang cập nhật",
      measurements: "N/A",
      height: "N/A",
      profileImage: `https://via.placeholder.com/300x400/1f2937/ffffff?text=${encodeURIComponent(name)}`,
      gallery: [],
      filmography: [],
      toast: "Dữ liệu diễn viên đang được cập nhật từ JAVDB"
    });
  }
}
