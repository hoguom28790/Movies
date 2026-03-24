import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ELITE JAVLIBRARY SCRAPER - Pro-grade mirroring + Bot evasion
const JAVL_MIRRORS = [
  "https://www.javlibrary.com/en",
  "https://www.v55r.com/en",
  "https://www.javlibrary.cc/en",
  "https://www.javlibrary.xyz/en"
];

async function fetchInternal(path: string, mirrorIdx = 0): Promise<any> {
  if (mirrorIdx >= JAVL_MIRRORS.length) return null;
  
  const mirror = JAVL_MIRRORS[mirrorIdx];
  const url = `${mirror}/${path.replace(/^\//, '')}`;
  
  try {
    console.log(`[JAVL-SYNC] Mirror ${mirrorIdx}: ${url}`);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": mirror + "/",
      },
      next: { revalidate: 3600 } // Cache for 1 hour on Vercel
    });

    if (res.status === 403) throw new Error("Cloudflare Block");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.includes("cf-browser-verification") || text.length < 3000) throw new Error("Bot Challenge");

    return { html: text, url: res.url, mirror };
  } catch (err: any) {
    console.warn(`[JAVL-SYNC] Mirror ${mirrorIdx} failed: ${err.message}`);
    return fetchInternal(path, mirrorIdx + 1);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const decodedName = decodeURIComponent(name).trim();
  console.log(`[JAVL-SCRAPE] Starting for: ${decodedName}`);

  try {
    // 1. SEARCH PHASE (JAVLIBRARY PRIMARY)
    const searchRes = await fetchInternal(`vl_star.php?s=${encodeURIComponent(decodedName)}`);
    
    if (searchRes) {
      console.log("[JAVL-SCRAPE] JavLibrary search successful. Processing data...");
      let finalHtml = searchRes.html;
      let finalUrl = searchRes.url;
      let $ = cheerio.load(finalHtml);

      // If redirected or only one match -> parsed directly
      // If not, pick from list
      if (finalUrl.includes("vl_star.php?s=")) {
        console.log("[JAVL-SCRAPE] Multi-result detected. Resolving best star...");
        const starLink = $(".star a").filter((_, el) => {
          const title = $(el).attr("title") || "";
          return title.toLowerCase().includes(decodedName.toLowerCase());
        }).first().attr("href");

        if (starLink) {
          console.log("[JAVL-SCRAPE] Jumping to star profile:", starLink);
          const redirected = await fetchInternal(starLink);
          if (redirected) {
            finalHtml = redirected.html;
            finalUrl = redirected.url;
            $ = cheerio.load(finalHtml);
          } else {
            console.warn("[JAVL-SCRAPE] Failed to follow star profile link.");
          }
        } else {
          console.warn("[JAVL-SCRAPE] No matching star found in multi-result list.");
        }
      }

      const actressData: any = {
        source: "javlibrary",
        id: finalUrl.split("?s=")[1] || finalUrl.split("=")[1],
        stageName: $(".boxtitle").first().text().trim() || decodedName,
        realName: "N/A",
        birthDate: "N/A",
        measurements: "N/A",
        height: "N/A",
        profileImage: "",
        gallery: [],
        filmography: []
      };

      // Extract Info
      $("#star_profile tr").each((_, row) => {
        const label = $(row).find(".header").text();
        const value = $(row).find("td:not(.header)").text().trim();
        if (label.includes("Birth Date")) actressData.birthDate = value;
        if (label.includes("Measurements")) actressData.measurements = value.replace(/\s+/g, '-');
        if (label.includes("Height")) actressData.height = value;
      });

      const avatar = $("#star_profile img").attr("src");
      if (avatar) actressData.profileImage = avatar.startsWith("//") ? "https:" + avatar : avatar;
      if (actressData.profileImage) actressData.gallery.push(actressData.profileImage);

      // Filmography - MASTER LISTING
      $(".videothumblist .video").each((_, video) => {
          const $v = $(video);
          const code = $v.find(".id").text().trim();
          const title = $v.find("a").attr("title") || "";
          const poster = $v.find("img").attr("src");
          const rating = $v.find(".score").text().trim();

          if (code) {
            actressData.filmography.push({
              code: code.toUpperCase(),
              title: title.replace(code, '').trim(),
              poster: poster?.startsWith("//") ? "https:" + poster : poster,
              year: "N/A",
              rating: rating || "N/A"
            });
          }
      });

      console.log(`[JAVL-SCRAPE] JavLibrary found ${actressData.filmography.length} titles for ${actressData.stageName}`);

      // SYNC WITH JAVDB FOR GALLERY (Optional enhancement)
      try {
        console.log("[JAVL-SCRAPE] Attempting to fetch JAVDB gallery for enhancement...");
        const javdbRes = await fetch(`${req.nextUrl.origin}/api/javdb/actress/${encodeURIComponent(decodedName)}`);
        if (javdbRes.ok) {
           const javdbData = await javdbRes.json();
           if (javdbData.gallery?.length > 0) {
              actressData.gallery = Array.from(new Set([...actressData.gallery, ...javdbData.gallery]));
              actressData.source += " + javdb-gallery";
              console.log(`[JAVL-SCRAPE] Successfully merged ${javdbData.gallery.length} gallery items from JAVDB.`);
           } else {
             console.log("[JAVL-SCRAPE] JAVDB gallery found, but no new items to merge.");
           }
        } else {
          console.warn(`[JAVL-SCRAPE] JAVDB gallery fetch failed with status: ${javdbRes.status}`);
        }
      } catch (e: any) {
        console.warn("[JAVL-SCRAPE] Error fetching JAVDB gallery:", e.message);
      }

      return NextResponse.json(actressData);
    }
    
    console.warn("[JAVL-SCRAPE] JavLibrary search returned nothing or all mirrors failed.");
    throw new Error("JavLibrary search returned nothing");

  } catch (error: any) {
    console.error("[JAVL-SCRAPE] Primary JavLibrary scrape failed. Attempting JAVDB fallback...", error.message);
    // FALLBACK TO JAVDB API DIRECTLY
    try {
      console.log(`[JAVL-SCRAPE] Fetching from JAVDB API: ${req.nextUrl.origin}/api/javdb/actress/${encodeURIComponent(decodedName)}`);
      const javdbRes = await fetch(`${req.nextUrl.origin}/api/javdb/actress/${encodeURIComponent(decodedName)}`);
      if (javdbRes.ok) {
        console.log("[JAVL-SCRAPE] JAVDB fallback successful.");
        return javdbRes; // Return the JAVDB response directly
      } else {
        console.error(`[JAVL-SCRAPE] JAVDB fallback failed with status: ${javdbRes.status}`);
      }
    } catch (e: any) {
      console.error("[JAVL-SCRAPE] Error during JAVDB fallback:", e.message);
    }
    
    console.error("[JAVL-SCRAPE] Both JavLibrary and JAVDB failed. Returning generic fallback.");
    return NextResponse.json({
       source: "fallback",
       stageName: decodedName,
       realName: "Đang cập nhật",
       birthDate: "N/A",
       measurements: "N/A",
       height: "N/A",
       profileImage: `https://via.placeholder.com/300x450/0f1115/ffffff?text=${encodeURIComponent(decodedName)}`,
       gallery: [],
       filmography: [],
       toast: "Không thể kết nối JavLibrary hoặc JAVDB. Vui lòng thử lại sau."
    });
  }
}
