import * as cheerio from "cheerio";

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
      });
      
      if (res.ok) {
        const text = await res.text();
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

export async function getJavDBActressProfile(name: string) {
  try {
    const searchRes = await fetchFromMirrors(`/search?q=${encodeURIComponent(name)}&f=actress`);
    let slug = "";

    if (searchRes) {
      if (searchRes.url.includes("/a/")) {
        slug = searchRes.url.split("/").pop()?.split("?")[0] || "";
      } else {
        const $search = cheerio.load(searchRes.html);
        const href = $search("a.item, .actress-item a, .actor-box a").filter((_, el) => {
          const h = $search(el).attr("href");
          return typeof h === "string" && h.startsWith("/a/");
        }).first().attr("href");
        if (href) slug = href.replace("/a/", "");
      }
    }

    if (!slug) slug = name.toLowerCase().replace(/\s+/g, "-");

    const detailRes = await fetchFromMirrors(`/a/${slug}`);
    if (!detailRes) throw new Error("Could not fetch detail page");

    const html = detailRes.html;
    const $ = cheerio.load(html);
    
    const parsedData: any = {
      source: "javdb",
      id: slug,
      stageName: $("h1.title, .title.is-4").first().text().trim() || name,
      realName: "N/A",
      birthDate: "N/A",
      measurements: "N/A",
      height: "N/A",
      birthPlace: "N/A",
      profileImage: $(".avatar img, .profile img").first().attr("src") || "",
      gallery: [],
      filmography: []
    };

    $(".panel-block, p.is-size-7").each((_, el) => {
      const text = $(el).text();
      const val = text.includes(":") ? text.split(":")[1].trim() : "";
      
      if (text.includes("Real Name") || text.includes("本名")) parsedData.realName = val;
      if (text.includes("Birthday") || text.includes("生年月日")) parsedData.birthDate = val;
      if (text.includes("Measurements") || text.includes("スリーサイズ")) parsedData.measurements = val;
      if (text.includes("Height") || text.includes("身長")) parsedData.height = val;
      if (text.includes("Birthplace") || text.includes("出身地")) parsedData.birthPlace = val;
      if (text.includes("Debut") || text.includes("デビュー")) parsedData.debutYear = val;
      if (text.includes("Studio") || text.includes("メーカー")) parsedData.studio = val;
      if (text.includes("Status") || text.includes("ステータス")) parsedData.status = val;
    });

    $(".preview-images img, .gallery img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("avatar")) {
        parsedData.gallery.push(src.startsWith("//") ? "https:" + src : src);
      }
    });

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

    return parsedData;
  } catch (err) {
    console.error("[JAVDB-SCRAPER]", err);
    return null;
  }
}
