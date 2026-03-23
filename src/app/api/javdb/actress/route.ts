import { NextRequest, NextResponse } from "next/server";

const JAVDB_BASE = "https://javdb.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    // 1. Primary search: Exact name query with actor filter
    const searchUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=actor`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "over18=1; locale=en",
      },
      redirect: 'follow'
    });

    const html = await res.text();
    const finalUrl = res.url;

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

       // Extract block text to verify name
       const blockRegex = new RegExp(`href="\\/actors\\/${id}"[\\s\\S]{0,150}?>([\\s\\S]*?)<\\/`, "i");
       const blockMatch = html.match(blockRegex);
       if (blockMatch) {
          const content = blockMatch[1].toLowerCase();
          // Score based on how many name parts match
          const score = nameParts.filter(p => content.includes(p)).length;
          results.push({ id, score });
          if (score === nameParts.length) break; // Perfect match
       }
    }

    // Sort by match score and pick best
    results.sort((a, b) => b.score - a.score);
    let bestMatchId = results.length > 0 ? results[0].id : null;

    // Fallback: search by first word of name if no match was found
    if (!bestMatchId && nameParts.length > 0) {
       const fallbackUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(nameParts[0])}&f=actor`;
       const fbRes = await fetch(fallbackUrl, { headers: { "Cookie": "over18=1; locale=en", "User-Agent": "Mozilla/5.0" } });
       const fbHtml = await fbRes.text();
       const fbMatch = fbHtml.match(/\/actors\/([a-zA-Z0-9]+)/);
       if (fbMatch) bestMatchId = fbMatch[1];
    }

    if (!bestMatchId) {
      return NextResponse.json({ error: "Actress not found" }, { status: 404 });
    }

    return NextResponse.json({ id: bestMatchId });
  } catch (error) {
    console.error("JAVDB Search Final Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
