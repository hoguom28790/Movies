import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  console.log(`[Stream Resolver] Attempting to resolve: ${url}`);

  // Patterns for known providers
  if (url.includes('streamxx.net')) {
    const code = url.split('/').pop();
    const base = url.split('/player/')[0] || "https://embed.streamxx.net";
    // Pattern: https://embed.streamxx.net/stream/{code}/main.m3u8
    const directM3U8 = `${base.replace('embed.', '')}/stream/${code}/main.m3u8`;
    const proxiedUrl = `/api/topxx/proxy?url=${encodeURIComponent(directM3U8)}`;
    return NextResponse.json({ url: proxiedUrl, type: 'hls' });
  }

  if (url.includes('upload18.org/play/index/')) {
     const id = url.split('index/')[1];
     const directM3U8 = `https://upload18.org/hls/${id}/index.m3u8`;
     const proxiedUrl = `/api/topxx/proxy?url=${encodeURIComponent(directM3U8)}`;
     return NextResponse.json({ url: proxiedUrl, type: 'hls' });
  }

  // Fallback: return same URL
  return NextResponse.json({ url, type: 'embed' });
}
