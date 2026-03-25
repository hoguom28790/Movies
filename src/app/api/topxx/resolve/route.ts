import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  console.log(`[Stream Resolver] Attempting to resolve: ${url}`);

  // Patterns for known providers
  if (url.includes('streamxx.net')) {
     return NextResponse.json({ url: url, type: 'embed' });
  }

  if (url.includes('upload18.org/play/index/')) {
     return NextResponse.json({ url: url, type: 'embed' });
  }

  // Fallback: return same URL
  return NextResponse.json({ url, type: 'embed' });
}
