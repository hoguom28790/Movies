import { NextRequest, NextResponse } from "next/server";

// Mirror domains to bypass restrictions
const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb34.com",
  "https://javdb00.com",
  "https://javdb.one"
];

async function fetchFromMirrors(path: string) {
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
    "Referer": "https://javdb.com/"
  };

  for (const mirror of JAVDB_MIRRORS) {
    try {
      const url = `${mirror}${path}`;
      const res = await fetch(url, { headers: commonHeaders, next: { revalidate: 1800 } });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("actors")) return { html: text, base: mirror };
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed, trying next...`);
    }
  }
  throw new Error("All JAVDB mirrors failed to respond");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  try {
    // JAVDB full actress implementation - real name, measurements, height, gallery, complete filmography, codes, rating, preview images, direct links
    const { html, base } = await fetchFromMirrors(`/actors/${id}?f=all`);

    const info: any = {
      realName: "",
      stageName: "",
      birthDate: "",
      measurements: "",
      height: "",
      profileImage: "",
      birthPlace: "",
      studio: "",
      debutYear: "",
      status: "Active",
      gallery: [],
      filmography: []
    };

    // 1. Scraping Biographical Data (phoenixthrush/javdb-python logic translation)
    const nameMatch = html.match(/<h2 class="title is-4">([\s\S]*?)<\/h2>/);
    const rawNames = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : "Unknown";
    // JAVDB often shows "Stage Name (Real Name)"
    if (rawNames.includes("(") && rawNames.includes(")")) {
       const parts = rawNames.match(/(.*?)\((.*?)\)/);
       if (parts) {
         info.stageName = parts[1].trim();
         info.realName = parts[2].trim();
       } else {
         info.stageName = rawNames;
       }
    } else {
       info.stageName = rawNames;
       info.realName = rawNames;
    }

    // Profile Image
    const avatarMatch = html.match(/<div class="avatar" style="background-image: url\((.*?)\)/);
    info.profileImage = avatarMatch ? avatarMatch[1] : "";

    // Stats Grid Parsing
    const panels = html.matchAll(/<p class="is-size-7">([\s\S]*?): ([\s\S]*?)<\/p>/g);
    for (const match of panels) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].replace(/<[^>]+>/g, '').trim();
      
      if (key.includes("birthday") || key.includes("生日")) info.birthDate = val;
      if (key.includes("height") || key.includes("身高")) info.height = val;
      if (key.includes("measurements") || key.includes("三圍")) info.measurements = val;
      if (key.includes("birthplace") || key.includes("出生地")) info.birthPlace = val;
    }

    // 2. Filmography (Full array parsing)
    const movieItems = html.split(/<div class="item">|<div class="grid-item">/);
    movieItems.shift(); // Remove first empty split

    movieItems.forEach(block => {
      const vidMatch = block.match(/href="\/v\/([a-zA-Z0-9]+)"/);
      const posterMatch = block.match(/<img (?:lazy-)?src="(.*?)"/);
      const uidMatch = block.match(/class="uid">([\s\S]*?)<\/div>|<strong>([\s\S]*?)<\/strong>/);
      const titleMatch = block.match(/class="video-title">([\s\S]*?)<\/div>|class="title">([\s\S]*?)<\/div>/);
      const ratingMatch = block.match(/class="value font-weight-bold">([\d\.-]+)<\/span>|class="value">([\d\.-]+)<\/span>/);
      const metaMatch = block.match(/class="meta">([\s\S]*?)<\/div>/);

      if (vidMatch && (posterMatch || uidMatch)) {
        const code = uidMatch ? (uidMatch[1] || uidMatch[2] || "").replace(/<[^>]+>/g, '').trim() : "N/A";
        const titleRaw = titleMatch ? (titleMatch[1] || titleMatch[2] || "").replace(/<[^>]+>/g, '').trim() : "Untitled";
        const cleanTitle = titleRaw.startsWith(code) ? titleRaw.replace(code, '').trim() : titleRaw;
        
        info.filmography.push({
          code,
          title: cleanTitle,
          poster: posterMatch ? (posterMatch[1].startsWith("http") ? posterMatch[1] : `${base}${posterMatch[1]}`) : "",
          year: metaMatch ? metaMatch[1].split("-")[0].trim() : "N/A",
          rating: ratingMatch ? (ratingMatch[1] || ratingMatch[2]) : "N/A",
          // JAVDB Preview Logic: Usually cover images are high-res versions of thumbs
          previewImage: posterMatch ? (posterMatch[1].replace("/thumbs/", "/covers/").replace("/t_", "/")) : "", 
          link: `https://javdb.com/v/${vidMatch[1]}`
        });
      }
    });

    // 3. Gallery Extraction
    const galleryMatches = html.matchAll(/<a href="(.*?)" data-fancybox="gallery">/g);
    for (const match of galleryMatches) {
       if (match[1] && !info.gallery.includes(match[1])) {
         info.gallery.push(match[1]);
       }
    }

    // Fallback Gallery if empty (using filmography posters formatted as covers)
    if (info.gallery.length === 0) {
       info.gallery = info.filmography.slice(0, 12).map((f: any) => f.previewImage || f.poster).filter(Boolean);
    }

    return NextResponse.json(info);

  } catch (err: any) {
    console.error("JAVDB Full Sync Error:", err);
    return NextResponse.json({ 
       error: "Scraping failed", 
       fallback: { 
         stageName: "System Recovery", 
         realName: "Unknown", 
         gallery: [], 
         filmography: [] 
       } 
    }, { status: 500 });
  }
}
