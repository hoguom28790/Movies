// src/app/api/javlibrary/actress/[id]/route.ts
// Switched to JavLibrary primary scraper for stable actress data + full fields + fallback
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const JAVLIB_MIRRORS = [
  'https://www.javlibrary.com/en',
  'https://www.javlibrary.com/ja',
  'https://www.v28p.com/en',
  'https://www.v28p.com/ja',
];

const JAVDB_MIRRORS = [
  'https://javdb.com',
  'https://javdb36.com',
  'https://javdb00.com',
  'https://javdb.one',
];

async function fetchWithMirrors(mirrors: string[], path: string) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': 'over18=1; locale=en; theme=dark',
  };

  for (const mirror of mirrors) {
    try {
      const url = `${mirror}${path}`;
      const res = await fetch(url, { 
        headers: { ...headers, 'Referer': mirror + '/' }, 
        cache: 'no-store' 
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 500 && !text.includes("choto.click")) {
          return { html: text, url: res.url, mirrorUsed: mirror };
        }
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = decodeURIComponent(id);

  console.log("[JavLibrary] Searching for:", name);

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
    filmography: []
  };

  try {
    // STEP 1: JAVLibrary (Primary)
    const searchRes = await fetchWithMirrors(JAVLIB_MIRRORS, `/vl_star.php?&mode=&s=${encodeURIComponent(name)}`);
    
    if (searchRes) {
      console.log("[JavLibrary] Found search results");
      const $search = cheerio.load(searchRes.html);
      
      // Get the first star link
      let starUrl = '';
      const starLink = $search('.star a').first().attr('href');
      if (starLink) {
        starUrl = starLink.startsWith('http') ? starLink : (starLink.startsWith('/') ? `${searchRes.mirrorUsed}${starLink}` : `${searchRes.mirrorUsed}/${starLink}`);
      } else if (searchRes.html.includes('star-details')) {
        // We are already on the detail page
        starUrl = searchRes.url;
      }

      if (starUrl) {
        const detailRes = await fetchWithMirrors([], starUrl);
        if (detailRes) {
          console.log("[JavLibrary] Found actress page");
          const $ = cheerio.load(detailRes.html);
          data.source = 'javlibrary';
          data.stageName = $('.header .title').text().trim() || data.stageName;
          
          // Parse Bio
          const bioBlock = $('.star-details, .infopage').text();
          const birthMatch = bioBlock.match(/Birthday: (.*?)\n/i) || bioBlock.match(/生年月日: (.*?)\n/i);
          const heightMatch = bioBlock.match(/Height: (.*?)\n/i) || bioBlock.match(/身長: (.*?)\n/i);
          const measureMatch = bioBlock.match(/Measurements: (.*?)\n/i) || bioBlock.match(/スリーサイズ: (.*?)\n/i);

          if (birthMatch) data.birthDate = birthMatch[1].trim();
          if (heightMatch) data.height = heightMatch[1].trim();
          if (measureMatch) data.measurements = measureMatch[1].trim();
          
          // Profile Image
          data.profileImage = $('#star_img img').attr('src') || data.profileImage;
          if (data.profileImage.startsWith('//')) data.profileImage = 'https:' + data.profileImage;

          // Filmography
          $('.videothumblist .video').each((_, el) => {
            const $v = $(el);
            const code = $v.find('.id').text().trim();
            const title = $v.find('.title').text().trim();
            const poster = $v.find('img').attr('src');
            
            if (code) {
              data.filmography.push({
                code,
                title,
                poster: poster?.startsWith('//') ? 'https:' + poster : poster,
                year: 'N/A',
                rating: 'N/A'
              });
            }
          });

          // Gallery (Javlibrary doesn't have a dedicated gallery tab easily, usually covers)
          data.gallery = data.filmography.slice(0, 10).map((f: any) => f.poster).filter(Boolean);
        }
      }
    }

    // STEP 2: JAVDB Fallback (if JAVLIBRARY failed or for more Bio info)
    if (data.source === 'fallback' || data.gallery.length === 0) {
      console.log("[JAVDB] Fallback search for:", name);
      const dbSearchRes = await fetchWithMirrors(JAVDB_MIRRORS, `/search?q=${encodeURIComponent(name)}&f=actress`);
      if (dbSearchRes) {
          let dbSlug = "";
          if (dbSearchRes.url.includes("/a/")) {
             dbSlug = dbSearchRes.url.split("/").pop()?.split("?")[0] || "";
          } else {
             const $dbSearch = cheerio.load(dbSearchRes.html);
             const dbHref = $dbSearch("a.item, .actor-box a").filter((_, el) => {
               const h = cheerio.load(el)('a').attr('href') || cheerio.load(el).root().attr('href');
               return typeof h === "string" && h.startsWith("/a/");
             }).first().attr("href");
             if (dbHref) dbSlug = dbHref.replace("/a/", "");
          }

          if (dbSlug) {
            const dbDetailRes = await fetchWithMirrors(JAVDB_MIRRORS, `/a/${dbSlug}`);
            if (dbDetailRes) {
               const $db = cheerio.load(dbDetailRes.html);
               if (data.source === 'fallback') data.source = 'javdb';
               
               // Fill gaps
               if (data.birthDate === "Đang cập nhật") {
                  $db(".panel-block").each((_, el) => {
                    const text = $db(el).text();
                    if (text.includes("Birthday") || text.includes("生年月日")) data.birthDate = text.split(":")[1]?.trim();
                  });
               }
               
               $db(".preview-images img").each((_, el) => {
                  const src = $db(el).attr("src");
                  if (src && !data.gallery.includes(src)) data.gallery.push(src.startsWith("//") ? "https:" + src : src);
               });

               if (data.filmography.length === 0) {
                  $db(".movie-list .item, .grid-item").each((_, el) => {
                    const code = $db(el).find(".uid, strong").first().text().trim();
                    const title = $db(el).find(".video-title, .title").first().text().trim();
                    const poster = $db(el).find("img").first().attr("src");
                    if (code) {
                       data.filmography.push({
                         code,
                         title,
                         poster: poster?.startsWith("//") ? "https:" + poster : poster,
                         year: "N/A",
                         rating: "N/A"
                       });
                    }
                  });
               }
            }
          }
      }
    }

    console.log("[Scraper] Parsed data for " + name + ": " + data.filmography.length + " movies found.");
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("[Scraper] Critical Failure:", err.message);
    return NextResponse.json(data);
  }
}
