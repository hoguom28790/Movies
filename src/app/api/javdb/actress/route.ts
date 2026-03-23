import { NextRequest, NextResponse } from "next/server";

const JAVDB_BASE = "https://javdb.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    // 1. Better search query for actors
    const searchUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=actor`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "over18=1; locale=zh",
      },
      redirect: 'follow'
    });

    const html = await res.text();
    const finalUrl = res.url;

    // 2. If already redirected to an actor page (happens for some exact matches)
    if (finalUrl.includes("/actors/")) {
      const id = finalUrl.split("/").pop();
      return NextResponse.json({ id });
    }

    // 3. Robust parsing for search results list
    // JAVDB search result for actors usually has <div class="box actor-box"> or links in a specific container
    // Match pattern: /actors/[ID] and then check if the text contains the name parts
    const actorLinks = html.matchAll(/\/actors\/([a-zA-Z0-9]+)/g);
    const seenIds = new Set();
    let bestMatchId = null;

    // Normalize input name for comparison (e.g., "Misono Waka" -> ["misono", "waka"])
    const nameParts = name.toLowerCase().split(/[ \-]+/).filter(p => p.length > 1);

    for (const match of actorLinks) {
       const id = match[1];
       if (seenIds.has(id)) continue;
       seenIds.add(id);

       // Extract the link text or surrounding content to verify name
       // This is a bit complex in regex, so we'll look for the first few potential IDs
       // Usually the first result in a search?f=actor is the intended one
       if (!bestMatchId) bestMatchId = id;

       // If we can find the name parts in the HTML block around the link, it's a winner
       const blockRegex = new RegExp(`href="\\/actors\\/${id}"[\\s\\S]{0,100}?>([\\s\\S]*?)<\\/`, "i");
       const blockMatch = html.match(blockRegex);
       if (blockMatch) {
          const content = blockMatch[1].toLowerCase();
          if (nameParts.every(part => content.includes(part))) {
             bestMatchId = id;
             break; // Exact match found
          }
       }
    }

    if (!bestMatchId) {
      // Fallback: search for any actors ID if no redirect and no specific box match
      const genericMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
      if (genericMatch) bestMatchId = genericMatch[1];
    }

    if (!bestMatchId) {
      return NextResponse.json({ error: "Actress not found" }, { status: 404 });
    }

    return NextResponse.json({ id: bestMatchId });
  } catch (error) {
    console.error("JAVDB Search Advanced Error:", error);
    return NextResponse.json({ error: "Failed to search JAVDB" }, { status: 500 });
  }
}
