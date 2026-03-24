import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb34.com",
  "https://javdb00.com",
  "https://javdb.one"
];

async function fetchWithMirrors(path: string, headers: any) {
  for (const mirror of JAVDB_MIRRORS) {
    try {
      const url = mirror + path;
      const res = await fetch(url, { headers, next: { revalidate: 3600 } });
      if (res.ok) {
        const text = await res.text();
        return { html: text, url: res.url, ok: true, status: res.status };
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed, trying next...`);
    }
  }
  throw new Error("All JAVDB mirrors failed");
}

// FINAL JAVDB scraper fix: search first → get slug → parse detail with real selectors + full debug logs
export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
    "Referer": "https://javdb.com/"
  };

  try {
    console.log("Searching JAVDB for: " + name);
    const searchPath = `/search?q=${encodeURIComponent(name)}&f=actress`;
    const searchResult = await fetchWithMirrors(searchPath, headers);
    
    const searchHtml = searchResult.html;
    const $search = cheerio.load(searchHtml);
    
    // Bước 1: Parse slug
    let slug = "";
    const href = $search(".item, .actress, .actor-box").find("a[href^='/a/']").first().attr("href");
    
    if (href && href.startsWith("/a/")) {
       slug = href.replace("/a/", "");
    }
    
    if (searchResult.url.includes("/a/")) {
       slug = searchResult.url.split("/").pop()?.split("?")[0] || "";
    }

    if (!slug) {
       console.log("Slug not found, trying name as fallback slug");
       slug = name.toLowerCase().replace(/\s+/g, "-");
    }

    console.log("Found slug: " + slug);
    
    // Bước 2: Fetch detail page
    const detailPath = `/a/${slug}`;
    const detailResult = await fetchWithMirrors(detailPath, headers);
    
    const html = detailResult.html;
    console.log("Fetched detail page length: " + html.length);
    
    const $ = cheerio.load(html);
    
    const data: any = {
       source: "javdb",
       id: slug,
       stageName: $("h1.title, .title.is-4").first().text().trim() || name,
       realName: "N/A",
       birthDate: "N/A",
       measurements: "N/A",
       height: "N/A",
       birthPlace: "N/A",
       studio: "Various",
       debutYear: "N/A",
       status: "Active",
       profileImage: $(".avatar img, img.profile").first().attr("src") || "",
       gallery: [],
       filmography: []
    };

    // Parse info panel
    $(".panel-block, p.is-size-7").each((_, el) => {
       const text = $(el).text();
       const val = text.includes(":") ? text.split(":")[1].trim() : "";
       
       if (text.includes("Real Name") || text.includes("本名")) data.realName = val;
       if (text.includes("Birthday") || text.includes("生年月日")) data.birthDate = val;
       if (text.includes("Measurements") || text.includes("スリーサイズ")) data.measurements = val;
       if (text.includes("Height") || text.includes("身長")) data.height = val;
       if (text.includes("Birthplace") || text.includes("出身地")) data.birthPlace = val;
    });

    // Gallery section
    $(".preview-images a, .gallery a, .preview-images img").each((_, el) => {
       const src = $(el).attr("href") || $(el).attr("src");
       if (src && !data.gallery.includes(src) && !src.includes("avatar")) {
          data.gallery.push(src);
       }
    });

    // Filmography grid
    $(".movie-list .item, .grid-item, .item").each((_, el) => {
       const $item = $(el);
       const code = $item.find(".uid, strong").first().text().trim();
       const title = $item.find(".video-title, .title").first().text().trim();
       const poster = $item.find("img").first().attr("src");
       const year = $item.find(".meta").first().text().split("-")[0].trim();
       const rating = $item.find(".value").first().text().trim();

       if (code && code !== data.stageName) {
           data.filmography.push({
               code,
               title: title.startsWith(code) ? title.replace(code, '').trim() : title,
               poster: poster?.startsWith("//") ? "https:" + poster : poster,
               year: year || "N/A",
               rating: rating || "N/A"
           });
       }
    });

    console.log("Parsed actress data: " + JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("JAVDB Scraper Error:", error);
    // Return dummy data on failure but with 200 to avoid crash
    return NextResponse.json({
      source: "javdb-fallback",
      id: "fallback-" + name,
      stageName: name,
      realName: "Đang cập nhật",
      birthDate: "Đang cập nhật",
      measurements: "Đang cập nhật",
      height: "Đang cập nhật",
      profileImage: "",
      gallery: [],
      filmography: [],
      error: error.message,
      toast: "Dữ liệu đang được cập nhật từ JAVDB"
    });
  }
}
