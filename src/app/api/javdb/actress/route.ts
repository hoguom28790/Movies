import { NextRequest, NextResponse } from "next/server";

const JAVDB_BASE = "https://javdb.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const searchUrl = `${JAVDB_BASE}/search?q=${encodeURIComponent(name)}&f=actor`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "over18=1; locale=zh",
      },
    });

    const html = await res.text();
    
    // Simple regex to find actor link: /actors/[ID]
    const actorMatch = html.match(/\/actors\/([a-zA-Z0-9]+)/);
    
    if (!actorMatch) {
      return NextResponse.json({ error: "Actress not found" }, { status: 404 });
    }

    const id = actorMatch[1];
    
    return NextResponse.json({ id });
  } catch (error) {
    console.error("JAVDB Search Error:", error);
    return NextResponse.json({ error: "Failed to search JAVDB" }, { status: 500 });
  }
}
