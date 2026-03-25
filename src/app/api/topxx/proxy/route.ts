import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("No URL", { status: 400 });

  try {
    const origin = new URL(url).origin;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": origin + "/",
        "Origin": origin,
        "Accept": "*/*"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      console.error(`[HLS Proxy] Upstream returned ${res.status} for: ${url}`);
      return new NextResponse(`Upstream Error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";
    
    // If it's a manifest, rewrite URLs inside
    if (contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL") || url.includes(".m3u8")) {
      let text = await res.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      const origin = new URL(url).origin;
      
      // 1. Rewrite URI="url" attributes (Keys, Sub-manifests)
      let proxiedText = text.replace(/URI="([^"]+)"/gi, (match, link) => {
        let absoluteUrl = link;
        try { if (!link.startsWith("http")) absoluteUrl = new URL(link, baseUrl).toString(); } catch(e) { return match; }
        return `URI="/api/topxx/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
      });

      // 2. Rewrite direct URL lines (Segments, Variants)
      const lines = proxiedText.split("\n").map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed === "") return line;
        
        let absoluteUrl = trimmed;
        try { if (!trimmed.startsWith("http")) absoluteUrl = new URL(trimmed, baseUrl).toString(); } catch(e) { return line; }
        return `/api/topxx/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      });
      
      return new NextResponse(lines.join("\n"), {
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
