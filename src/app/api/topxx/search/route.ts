import { NextResponse } from "next/server";
import { searchTopXXMovies } from "@/services/api/topxx";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!keyword) {
    return NextResponse.json({ items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 1 } });
  }

  try {
    const results = await searchTopXXMovies(keyword, page);
    return NextResponse.json(results);
  } catch (error) {
    console.error("TopXX Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
