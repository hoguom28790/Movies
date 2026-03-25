import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  console.log(`[Stream Resolver] Attempting to resolve: ${url}`);

  // Patterns for known providers
  if (url.includes('streamxx.net/player/')) {
    const directM3U8 = url.replace('/player/', '/stream/') + '/main.m3u8';
    return NextResponse.json({ url: directM3U8, type: 'hls' });
  }

  if (url.includes('upload18.org/play/index/')) {
     const id = url.split('index/')[1];
     const directM3U8 = `https://upload18.org/hls/${id}/index.m3u8`;
     return NextResponse.json({ url: directM3U8, type: 'hls' });
  }

  // Fallback: return same URL
  return NextResponse.json({ url, type: 'embed' });
}
