import { NextRequest, NextResponse } from "next/server";
import { getTopXXMovies } from "@/services/api/topxx";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "danh-sach") as any;
  const slug = searchParams.get("slug") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    const data = await getTopXXMovies(type, slug, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/topxx Failure:", error);
    return NextResponse.json({ 
      items: [], 
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } 
    }, { status: 500 });
  }
}
