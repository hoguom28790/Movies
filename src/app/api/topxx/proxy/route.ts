import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("No URL", { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://embed.streamxx.net/"
      }
    });

    if (!res.ok) return new NextResponse("Upstream Error", { status: res.status });

    const contentType = res.headers.get("content-type") || "";
    
    // If it's a manifest, rewrite URLs inside
    if (contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || url.includes(".m3u8")) {
      let text = await res.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      
      // Robust rewrite for manifests (Line URLs and URI="...")
      const proxiedText = text.replace(/(URI=")?([^"\n#]+\.(m3u8|ts|vtt|m4s)[^"\n]*)(?="|\n|$)/gi, (match, prefix, link) => {
        let absoluteUrl = link;
        try {
          if (!link.startsWith("http")) {
            absoluteUrl = new URL(link, baseUrl).toString();
          }
        } catch(e) { return match; }
        
        const wrap = `/api/topxx/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        return prefix ? `${prefix}${wrap}` : wrap;
      });
      
      return new NextResponse(proxiedText, {
        headers: {
          "Content-Type": "application/x-mpegURL",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // Binary / TS segments
    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600"
      }
    });
    
  } catch (error) {
    console.error("[HLS Proxy] Failed:", error);
    return new NextResponse("Proxy Error", { status: 500 });
  }
}
