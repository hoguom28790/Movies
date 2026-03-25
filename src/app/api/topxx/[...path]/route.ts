import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  
  const targetUrl = `https://topxx.vip/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;
  
  console.log(`[TopXX Proxy] Fetching: ${targetUrl}`);
  
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
       return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[TopXX Proxy] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
