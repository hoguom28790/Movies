// src/app/api/javlibrary/actress/[name]/route.ts
// FINAL FIX TopXX actress using JavLibrary scraper with real search → detail parsing
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const JAVLIB_MIRRORS = [
  'https://www.javlibrary.com/en',
  'https://www.v28p.com/en',
  'https://www.v28p.com/ja',
  'https://www.library43.com/en',
];

async function fetchWithMirrors(mirrors: string[], path: string, decode: boolean = true) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': 'over18=1; locale=en; theme=dark',
  };

  for (const mirror of mirrors) {
    try {
      const url = path.startsWith('http') ? path : `${mirror}${path}`;
      const res = await fetch(url, { 
        headers: { ...headers, 'Referer': mirror + '/' }, 
        cache: 'no-store' 
      });
      if (res.ok) {
        const text = await res.text();
        // Check if actually valid and not a Cloudflare or redirect page or parked domain
        if (text.length > 800 && !text.includes("choto.click") && (text.includes("star") || text.includes("video") || text.includes("actress"))) {
          return { html: text, url: res.url, mirrorUsed: mirror };
        }
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);

  console.log("[JAVLIBRARY] Searching for:", name);

  // Default / Empty data
  let data: any = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    source: 'fallback',
    realName: "Đang cập nhật",
    stageName: name,
    birthDate: "Đang cập nhật",
    measurements: "N/A",
    height: "N/A",
    profileImage: `https://via.placeholder.com/300x400/1f2937/ffffff?text=${encodeURIComponent(name)}`,
    gallery: [],
    filmography: [],
    syncTime: new Date().toISOString()
  };

  try {
    // STEP 1: Search to get link
    // Fetch: https://www.javlibrary.com/en/vl_star.php?s={encodeURIComponent(name)}
    const searchRes = await fetchWithMirrors(JAVLIB_MIRRORS, `/vl_star.php?s=${encodeURIComponent(name)}`);
    
    if (searchRes) {
      const $search = cheerio.load(searchRes.html);
      let detailUrl = "";

      // Check if Search result has a list or if we are already redirected to detail page
      if ($search(".star-details, .infopage").length > 0) {
        // Direct match / Already on detail page
        detailUrl = searchRes.url;
      } else {
        // List of results
        const starLink = $search(".star a").filter((_, el) => {
          return $search(el).text().toLowerCase().includes(name.toLowerCase());
        }).last().attr("href"); // Often the last one or exact text match is better

        if (starLink) {
           detailUrl = starLink.startsWith('http') ? starLink : (starLink.startsWith('/') ? `${searchRes.mirrorUsed}${starLink}` : `${searchRes.mirrorUsed}/${starLink}`);
        }
      }

      console.log("[JAVLIBRARY] Found detail URL:", detailUrl);

      if (detailUrl) {
         // STEP 2: Fetch detail page
         const detailRes = await fetchWithMirrors(JAVLIB_MIRRORS, detailUrl);
         if (detailRes) {
            const $ = cheerio.load(detailRes.html);
            data.source = "javlibrary";
            data.stageName = $(".header h1").text().trim() || $(".header .title").text().trim() || name;
            
            // Parse Bio fields based on labels
            $("tr").each((_, tr) => {
               const html = $(tr).html() || "";
               const text = $(tr).text();
               if (text.includes("Real Name") || text.includes("本名")) data.realName = $(tr).find("td").last().text().trim();
               if (text.includes("Birthdate") || text.includes("生年月日")) data.birthDate = $(tr).find("td").last().text().trim();
               if (text.includes("Measurements") || text.includes("スリーサイズ")) data.measurements = $(tr).find("td").last().text().trim();
               if (text.includes("Height") || text.includes("身長")) data.height = $(tr).find("td").last().text().trim();
            });

            // Profile Image (img in .profile or .avatar or #star_img)
            const pImg = $(".profile img, .avatar img, #star_img img").attr("src");
            if (pImg) data.profileImage = pImg.startsWith("//") ? "https:" + pImg : (pImg.startsWith("http") ? pImg : detailRes.mirrorUsed + pImg);

            // Studio / Others if possible
            const studio = $("tr").filter((_, tr) => $(tr).text().includes("Studio")).find("td").last().text().trim();
            if (studio) data.studio = studio;

            // Filmography: all movies in table / list
            $(".videothumblist .video").each((_, el) => {
               const $v = $(el);
               const code = $v.find(".id, strong").first().text().trim();
               const title = $v.find(".title, a").first().text().trim();
               const poster = $v.find("img").attr("src");
               const rating = $v.find(".score").text().trim() || "N/A";
               
               if (code) {
                  data.filmography.push({
                     code,
                     title: title || code,
                     poster: poster?.startsWith("//") ? "https:" + poster : poster,
                     year: "N/A",
                     rating
                  });
               }
            });

            // Gallery (Covers as gallery if no dedicated gallery section)
            data.gallery = data.filmography.slice(0, 12).map((f: any) => f.poster).filter(Boolean);
         }
      }
    }

    console.log(`[JAVLIBRARY] Parsed data for ${name}:`, JSON.stringify({ 
      source: data.source,
      stageName: data.stageName,
      filmCount: data.filmography.length,
      hasBio: !!data.realName && data.realName !== "Đang cập nhật",
      mirror: data.source === 'javlibrary' ? 'Successful' : 'Failed'
    }, null, 2));

    // Return final result
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("[JAVLIBRARY] Critical Failure:", err.message);
    // Add additional debug for failed state
    console.log("[JAVLIBRARY] Returning fallback data for:", name);
    return NextResponse.json(data);
  }
}
