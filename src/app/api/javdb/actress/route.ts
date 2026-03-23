import { NextRequest, NextResponse } from "next/server";

const JAVDB_MIRRORS = [
  "https://javdb.com",
  "https://javdb34.com",
  "https://javdb00.com",
  "https://javdb.one"
];

async function trySearchOnMirror(mirror: string, name: string) {
  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "over18=1; locale=en; theme=dark",
    "Referer": mirror
  };

  const nameEncoded = encodeURIComponent(name);
  const queries = [
    `${mirror}/search?q=${nameEncoded}&f=actor`,
    `${mirror}/search?q=${nameEncoded}&f=all`
  ];

  for (const queryUrl of queries) {
    try {
      const res = await fetch(queryUrl, { 
        headers: commonHeaders, 
        redirect: 'follow',
        next: { revalidate: 3600 } 
      });
      
      if (res.ok) {
        if (res.url.includes("/actors/")) {
           return { id: res.url.split("/").pop()?.split("?")[0] };
        }
        
        const html = await res.text();
        // Smarter extraction: Look for actor boxes specifically
        // JAVDB actor boxes usually contain the name and the link
        const nameParts = name.toLowerCase().split(/[ \-]+/).filter(p => p.length > 1);
        
        // Find all actor links and score them
        const actorLinks = Array.from(html.matchAll(/\/actors\/([a-zA-Z0-9]+)/g)).map(m => m[1]);
        const uniqueLinks = Array.from(new Set(actorLinks));
        
        let bestId = null;
        let maxScore = -1;
        
        for (const id of uniqueLinks.slice(0, 10)) {
           // Find the surrounding text for this ID
           const regex = new RegExp(`href="\\/actors\\/${id}"[\\s\\S]{0,300}?>([\\s\\S]*?)<\\/`, "i");
           const match = html.match(regex);
           if (match) {
              const textContent = match[1].toLowerCase();
              const score = nameParts.filter(p => textContent.includes(p)).length;
              if (score > maxScore) {
                 maxScore = score;
                 bestId = id;
              }
              if (score === nameParts.length) break; // Perfect match
           }
        }
        
        if (bestId) return { id: bestId };
      }
    } catch (e) { continue; }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    for (const mirror of JAVDB_MIRRORS) {
      const result = await trySearchOnMirror(mirror, name);
      if (result?.id) {
         return NextResponse.json({ id: result.id });
      }
    }

    return NextResponse.json({ error: "Actress not found across all attempts" }, { status: 404 });
  } catch (error) {
    console.error("JAVDB Global Attack Failure:", error);
    return NextResponse.json({ error: "Global retrieval failed" }, { status: 500 });
  }
}
