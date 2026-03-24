import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const JAVDB_MIRRORS = [
  "https://javdb34.com",
  "https://javdb35.com",
  "https://javdb36.com",
  "https://javdb00.com",
  "https://javdb001.com",
  "https://javdb.one",
  "https://javdb.com"
];

async function fetchWithMirrors(path: string, headers: any) {
  for (const mirror of JAVDB_MIRRORS) {
    try {
      const url = mirror + path;
      const mirrorHeaders = { ...headers, "Referer": mirror + "/" };
      const res = await fetch(url, { headers: mirrorHeaders, cache: "no-store" });
      
      if (res.ok) {
        const text = await res.text();
        // Detect dead/parked mirrors or Cloudflare challenges
        const isCloudflare = text.includes("cf-browser-verification") || text.includes("Cloudflare") || text.includes("Ray ID");
        const isParked = text.includes("choto.click") || text.includes("Domain Reserved") || text.includes("parked");
        
        if (isParked || (isCloudflare && text.length < 5000)) {
           console.warn(`Mirror ${mirror} returned blocked/parked page (Length: ${text.length})`);
           continue;
        }
        
        if (text.length < 1500 && !text.includes("actor-box") && !text.includes("item")) {
           console.warn(`Mirror ${mirror} returned suspiciously short content`);
           continue;
        }

        return { html: text, url: res.url, mirrorUsed: mirror, ok: true, status: res.status };
      }
      
      if (res.status === 403 || res.status === 429) {
        console.warn(`Mirror ${mirror} returned ${res.status}`);
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed:`, e);
    }
  }
  throw new Error("All JAVDB mirrors are currently blocking Vercel server requests (Cloudflare Challenge)");
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
    let searchHtml = "";
    let searchUrl = "";
    
    // Try different search filters
    const filters = ["actress", "actor", "all"];
    let searchResult: any = null;
    
    for (const filter of filters) {
       try {
          const path = `/search?q=${encodeURIComponent(name)}&f=${filter}`;
          searchResult = await fetchWithMirrors(path, headers);
          if (searchResult.html.includes("actor-box") || searchResult.html.includes("item")) {
             searchHtml = searchResult.html;
             searchUrl = searchResult.url;
             break;
          }
       } catch (e) { continue; }
    }
    
    if (!searchHtml && searchResult) {
       searchHtml = searchResult.html;
       searchUrl = searchResult.url;
    }

    const $search = cheerio.load(searchHtml || "");
    
    // Bước 1: Parse slug
    let slug = "";
    
    // Check if we were redirected to detail page
    if (searchUrl.includes("/a/")) {
       slug = searchUrl.split("/").pop()?.split("?")[0] || "";
    } else {
       // Look for actress link in results
       const actressLink = $search(".item a[href^='/a/'], .actor-box a[href^='/a/'], a[href^='/a/']").first();
       const href = actressLink.attr("href");
       if (href && href.startsWith("/a/")) {
          slug = href.replace("/a/", "");
       }
    }

    if (!slug) {
       console.log("Slug not found in search results, using name-based fallback");
       slug = name.toLowerCase().replace(/\s+/g, "-");
    }

    console.log("Found slug: " + slug);
    
    // Bước 2: Fetch detail page
    const detailPath = `/a/${slug}`;
    const detailResult = await fetchWithMirrors(detailPath, headers);
    const html = detailResult.html;
    
    console.log("Fetched detail page length: " + html.length);
    if (html.length < 2000) {
       console.log("Warning: HTML length suspiciously short. Content start: " + html.substring(0, 500));
    }
    
    const $ = cheerio.load(html);
    
    const data: any = {
       source: "javdb",
       syncTime: new Date().toISOString(),
       debug: {
          slug,
          mirrorUsed: detailResult?.mirrorUsed || searchResult?.mirrorUsed || "N/A",
          searchUrl,
          searchStatus: searchResult?.status || "N/A",
          htmlLength: html.length,
          isBlocked: html.includes("Checking your browser") || html.includes("Access denied") || html.includes("captcha"),
          htmlSnippet: html.substring(0, 500)
       },
       id: slug,
       stageName: $("h1.title, .title.is-4, .title").first().text().trim() || name,
       realName: "N/A",
       birthDate: "N/A",
       measurements: "N/A",
       height: "N/A",
       birthPlace: "N/A",
       studio: "Various",
       debutYear: "N/A",
       status: "Active",
       profileImage: $(".avatar img, img.profile, .actor-avatar img").first().attr("src") || "",
       gallery: [],
       filmography: []
    };

    // Parse info panel - Surgical approach
    $("p.is-size-7, .panel-block, .panel-block p").each((_, el) => {
       const $el = $(el);
       const text = $el.text();
       const label = $el.find("strong, b").first().text().trim();
       const val = text.replace(label, "").replace(":", "").trim();
       
       if (/real name|本名/i.test(label || text)) data.realName = val || data.realName;
       if (/birthday|生日|生年月日/i.test(label || text)) data.birthDate = val || data.birthDate;
       if (/measurements|三圍|スリーサイズ/i.test(label || text)) data.measurements = val || data.measurements;
       if (/height|身高|身長/i.test(label || text)) data.height = val || data.height;
       if (/birthplace|出生地/i.test(label || text)) data.birthPlace = val || data.birthPlace;
    });

    // Gallery section - Include high-res from Fancybox
    $(".preview-images a, .gallery a").each((_, el) => {
       const href = $(el).attr("href");
       if (href && !data.gallery.includes(href)) {
          data.gallery.push(href.startsWith("//") ? "https:" + href : href);
       }
    });
    
    // Fallback Gallery from images
    if (data.gallery.length === 0) {
       $(".preview-images img, .gallery img").each((_, el) => {
          const src = $(el).attr("src") || $(el).attr("data-src");
          if (src && !data.gallery.includes(src) && !src.includes("avatar")) {
             data.gallery.push(src.startsWith("//") ? "https:" + src : src);
          }
       });
    }

    // Filmography grid
    $(".movie-list .item, .grid-item, .item, .video-box").each((_, el) => {
       const $item = $(el);
       const code = $item.find(".uid, strong, .code").first().text().trim();
       const title = $item.find(".video-title, .title, .name").first().text().trim();
       const poster = $item.find("img").first().attr("src") || $item.find("img").first().attr("data-src");
       const year = $item.find(".meta, .date").first().text().split("-")[0].trim();
       const rating = $item.find(".value, .score").first().text().trim();

       if (code && code !== data.stageName && code.length > 2) {
           data.filmography.push({
               code,
               title: title.startsWith(code) ? title.replace(code, '').trim() : title,
               poster: poster?.startsWith("//") ? "https:" + poster : (poster?.startsWith("/") ? "https://javdb.com" + poster : poster),
               year: year || "N/A",
               rating: rating || "N/A"
           });
       }
    });

    // If still no real name, try to extract from title (Stage Name (Real Name))
    if ((data.realName === "N/A" || !data.realName) && data.stageName.includes("(")) {
       const match = data.stageName.match(/(.*?)\((.*?)\)/);
       if (match) {
          data.stageName = match[1].trim();
          data.realName = match[2].trim();
       }
    }

    // Sanitize results
    Object.keys(data).forEach(key => {
       if (data[key] === "N/A" || !data[key]) {
          // Keep as N/A or default
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
      toast: "JAVDB đang chặn truy vấn (Cloudflare). Đang thử lại..."
    });
  }
}
