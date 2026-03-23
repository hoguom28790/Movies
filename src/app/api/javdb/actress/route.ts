import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb00.com",
  "https://javdb34.com",
  "https://javdb.one"
];

async function fetchSearchFromMirrors(name: string) {
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
  };

  const nameEncoded = encodeURIComponent(name);

  for (const mirror of JAVDB_MIRRORS) {
    try {
      // Try search with actor filter first
      const searchUrl = `${mirror}/search?q=${nameEncoded}&f=actor`;
      const res = await fetch(searchUrl, { 
        headers: commonHeaders, 
        redirect: 'follow',
        next: { revalidate: 3600 } 
      });
      
      if (res.ok) {
        const finalUrl = res.url;
        const html = await res.text();
        return { html, finalUrl, base: mirror };
      }
    } catch (e) {
      console.warn(`Mirror Search ${mirror} failed, trying next...`);
    }
  }
  throw new Error("All mirrors failed for search");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const { html, finalUrl } = await fetchSearchFromMirrors(name);

    // Direct Redirect Case
    if (finalUrl.includes("/actors/")) {
      const id = finalUrl.split("/").pop()?.split("?")[0];
      return NextResponse.json({ id });
    }

    // List of results case
    const actorLinks = html.matchAll(/\/actors\/([a-zA-Z0-9]+)/g);
    const results: any[] = [];
    const seenIds = new Set();
    const nameParts = name.toLowerCase().split(/[ \-]+/).filter(p => p.length > 1);

    for (const match of actorLinks) {
       const id = match[1];
       if (seenIds.has(id)) continue;
       seenIds.add(id);

       const blockRegex = new RegExp(`href="\\/actors\\/${id}"[\\s\\S]{0,150}?>([\\s\\S]*?)<\\/`, "i");
       const blockMatch = html.match(blockRegex);
       if (blockMatch) {
          const content = blockMatch[1].toLowerCase();
          const score = nameParts.filter(p => content.includes(p)).length;
          results.push({ id, score });
          if (score === nameParts.length) break; 
       }
    }

    results.sort((a, b) => b.score - a.score);
    let bestId = results.length > 0 ? results[0].id : null;

    if (!bestId) {
      // Generic match as last resort
      const genericMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
      if (genericMatch) bestId = genericMatch[1];
    }

    if (!bestId) {
      return NextResponse.json({ error: "Actress not found" }, { status: 404 });
    }

    return NextResponse.json({ id: bestId });
  } catch (error) {
    console.error("JAVDB Search Epic Error:", error);
    return NextResponse.json({ error: "Search failed across all mirrors" }, { status: 500 });
  }
}
