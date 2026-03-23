import { NextRequest, NextResponse } from "next/server";

const JAVDB_BASE = "https://javdb.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Headers for real browser simulation
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://javdb.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cookie": "over18=1; locale=en; theme=dark",
  };

  try {
    // 1. Primary search: Actor filter
    let searchUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=actor`;
    let res = await fetch(searchUrl, { headers, redirect: 'follow' });
    
    // If blocked or error, retry once with general filter
    if (!res.ok) {
       searchUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=all`;
       res = await fetch(searchUrl, { headers, redirect: 'follow' });
    }

    const html = await res.text();
    const finalUrl = res.url;

    // Direct Redirect Case (Ideal)
    if (finalUrl.includes("/actors/")) {
      const id = finalUrl.split("/").pop()?.split("?")[0];
      return NextResponse.json({ id });
    }

    // List of results case - Scan for actor links
    let bestId = null;
    const actorLinks = Array.from(html.matchAll(/\/actors\/([a-zA-Z0-9]+)/g)).map(m => m[1]);
    const nameParts = name.toLowerCase().split(/[ \-]+/).filter(p => p.length > 0);

    if (actorLinks.length > 0) {
       // Loop through links and find the one that matches our name string best in HTML
       for (const id of actorLinks.slice(0, 5)) { // Check top 5 results
          const blockRegex = new RegExp(`href="\\/actors\\/${id}"[\\s\\S]{0,200}?>([\\s\\S]*?)<\\/`, "i");
          const blockMatch = html.match(blockRegex);
          if (blockMatch) {
             const content = blockMatch[1].toLowerCase();
             // Match weighting
             const matchCount = nameParts.filter(p => content.includes(p)).length;
             if (matchCount >= nameParts.length || matchCount >= 1) {
                bestId = id;
                if (matchCount >= nameParts.length) break; // Exact match or all parts found
             }
          }
       }
       if (!bestId) bestId = actorLinks[0]; // Fallback to first actor link found
    }

    // 2. Final Fallback: Broad search without actor filter if still no ID
    if (!bestId) {
       const broadRes = await fetch(`${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=all`, { headers });
       const broadHtml = await broadRes.text();
       const broadMatch = broadHtml.match(/\/actors\/([a-zA-Z0-9]+)/);
       if (broadMatch) bestId = broadMatch[1];
    }

    if (!bestId) {
      return NextResponse.json({ error: "Actress not found on JAVDB" }, { status: 404 });
    }

    return NextResponse.json({ id: bestId });
  } catch (error) {
    console.error("JAVDB Search Epic Error:", error);
    return NextResponse.json({ error: "Global Search Failure" }, { status: 500 });
  }
}
