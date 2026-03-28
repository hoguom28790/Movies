import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const referer = searchParams.get("referer");

  if (!url) return new Response("Missing URL", { status: 400 });

  const decodedUrl = decodeURIComponent(url);
  const decodedReferer = referer ? decodeURIComponent(referer) : new URL(decodedUrl).origin;

  // Domain Whitelist using patterns instead of exact domains
  const allowedPatterns = [
    'ophim', 'kkphim', 'vsmov', 'nguonc', 'phimapi',
    'topxx', 'avdbapi', 'streamxx', 'upload18', 'opstream',
    'googlevideo', 'akamaized', 'cloudfront', 'cdn', 'hls',
    'javplayer', 'jable', 'dplayer', 'filemoon', 'streamtape',
    'm3u8', 'mp4', 'mkv', 'ts', 'vip', 'sxx', 'play', 'video', 'stream'
  ];
  const urlObj = new URL(decodedUrl);
  const isAllowed = allowedPatterns.some(p => urlObj.hostname.includes(p) || urlObj.pathname.includes(p));
  
  if (!isAllowed) {
    return new Response("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': decodedReferer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': urlObj.origin
      }
    });

    if (!response.ok) {
       return new Response(`Remote server error: ${response.status}`, { status: response.status });
    }

    // Proxy the response headers with CORS
    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', '*');
    resHeaders.set('Cache-Control', 'no-cache');
    resHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    
    // Pipe the stream
    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });
  } catch (error: any) {
    console.error("[Proxy Error]", error);
    return new Response(`Proxy Error: ${error.message}`, { status: 500 });
  }
}
