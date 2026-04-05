import { NextRequest, NextResponse } from "next/server";
import { getTopXXDetails } from "@/services/api/topxx";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "mdIwhEBvYj";

  try {
    const item = await getTopXXDetails(slug);

    if (!item) {
      return NextResponse.json({ error: "getTopXXDetails returned null", slug });
    }

    const sources = (item as any).sources || [];
    return NextResponse.json({
      slug,
      itemKeys: Object.keys(item),
      sourcesCount: sources.length,
      sources: sources,
      title: (item as any).title || (item as any).name,
      source: (item as any).source
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), slug });
  }
}
