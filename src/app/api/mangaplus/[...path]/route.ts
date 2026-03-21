import { NextResponse } from "next/server";

// MangaPlus API Proxy (Official Shueisha uses Protobuf)
// Added MangaPlus (official Shueisha) as third source for high-quality official manga
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    // MangaPlus Web API base
    const MANGAPLUS_API_URL = `https://jumpg-webapi.tokyo-cdn.com/api/${path}?${searchParams}`;

    const response = await fetch(MANGAPLUS_API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://mangaplus.shueisha.co.jp/',
        'Origin': 'https://mangaplus.shueisha.co.jp',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "MangaPlus API Response Error" },
        { status: response.status }
      );
    }

    // Since MangaPlus returns binary (Protobuf), we proxy it as array buffer or blob
    // The reader/component will decode it either here or in the client.
    // For now, let's proxy the raw buffer so the consumer can handle it.
    const buffer = await response.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error("MangaPlus Proxy Exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
