import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ source: string }> }) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const { source } = await params;

  if (!slug) return NextResponse.json({ status: false, msg: "Missing slug" }, { status: 400 });

  let url = "";

  // 1. OPhim
  if (source === "ophim") {
    url = `https://ophim1.com/phim/${slug}`;
  } 
  // 2. KKPhim
  else if (source === "kkphim") {
    url = `https://phimapi.com/phim/${slug}`;
  } 
  // 3. VSMOV
  else if (source === "vsmov") {
    url = `https://vsmov.com/api/phim/${slug}`;
  } 
  // 4. NguonC
  else if (source === "nguonc") {
    url = `https://phim.nguonc.com/api/film/${slug}`;
  } 
  else {
    return NextResponse.json({ status: false, msg: "Invalid source" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Source API error");
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: false, msg: "Proxy Error" }, { status: 500 });
  }
}
