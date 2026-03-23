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

  // Strategies: 1. Exact, 2. Actor filter, 3. No spaces, 4. General search
  const queries = [
    `${mirror}/search?q=${encodeURIComponent(name)}&f=actor`,
    `${mirror}/search?q=${encodeURIComponent(name.replace(/\s+/g, ""))}&f=actor`,
    `${mirror}/search?q=${encodeURIComponent(name)}&f=all`
  ];

  for (const queryUrl of queries) {
    try {
      const res = await fetch(queryUrl, { headers: commonHeaders, redirect: 'follow' });
      if (res.ok) {
        if (res.url.includes("/actors/")) {
           return { id: res.url.split("/").pop()?.split("?")[0] };
        }
        const html = await res.text();
        const actorMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
        if (actorMatch) return { id: actorMatch[1] };
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
    // Try all mirrors with multi-strategy search
    for (const mirror of JAVDB_MIRRORS) {
      const result = await trySearchOnMirror(mirror, name);
      if (result?.id) {
         return NextResponse.json({ id: result.id });
      }
    }

    return NextResponse.json({ error: "Actress not found across all attempts" }, { status: 404 });
  } catch (error) {
    console.error("JAVDB Search Epic Failure:", error);
    return NextResponse.json({ error: "Search logic failed" }, { status: 500 });
  }
}
