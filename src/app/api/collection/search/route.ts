import { NextRequest, NextResponse } from "next/server";
import { searchTopXXMovies } from "@/services/api/v2k9r5w8m3x7n1p4q0z6";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");

  if (!q) return NextResponse.json({ items: [], pagination: { currentPage: 1, totalPages: 1 } });

  try {
    const data = await searchTopXXMovies(q, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
