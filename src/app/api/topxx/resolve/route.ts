import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60",
  };

  const decodedUrl = decodeURIComponent(url);

  // 1. Check for specific patterns
  if (decodedUrl.includes('.m3u8')) {
    return NextResponse.json({ url: decodedUrl, type: 'hls' }, { headers });
  }

  if (decodedUrl.includes('.mp4')) {
    return NextResponse.json({ url: decodedUrl, type: 'mp4' }, { headers });
  }

  // 2. Known Embed Domains
  const embedDomains = [
    'streamxx.net', 'upload18.org', 'dplayer.vip', 'filemoon.sx', 
    'streamtape.com', 'mixdrop.co', 'vidoza.net', 'voe.sx',
    'streamlare.com', 'upstream.to', 'supervideo.tv',
    'topxx.vip', 'avdbapi.com', 'javplayer', 'jable.tv'
  ];

  if (embedDomains.some(domain => decodedUrl.includes(domain))) {
    return NextResponse.json({ url: decodedUrl, type: 'embed' }, { headers });
  }

  // 3. Unknown URLs: Perform HEAD fetch for content-type detection
  try {
     const resHeaders = await fetch(decodedUrl, { 
        method: 'HEAD',
        headers: {
           'Referer': new URL(decodedUrl).origin,
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(3000)
     }).catch(() => null);

     if (resHeaders && resHeaders.ok) {
        const ct = resHeaders.headers.get('content-type')?.toLowerCase() || "";
        if (ct.includes('application/x-mpegurl') || ct.includes('vnd.apple.mpegurl')) {
           return NextResponse.json({ url: decodedUrl, type: 'hls' }, { headers });
        }
        if (ct.includes('video/')) {
           return NextResponse.json({ url: decodedUrl, type: 'mp4' }, { headers });
        }
     }
  } catch (err) {
     console.error("[Resolver Error]", err);
  }

  // Default fallback
  return NextResponse.json({ url: decodedUrl, type: 'embed' }, { headers });
}
