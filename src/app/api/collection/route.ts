import { NextRequest, NextResponse } from "next/server";
import { getTopXXMovies } from "@/services/api/v2k9r5w8m3x7n1p4q0z6";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const type = (searchParams.get("type") || "danh-sach") as "danh-sach" | "the-loai" | "quoc-gia" | "dien-vien";
  const slug = searchParams.get("slug") || "phim-moi-cap-nhat";

  try {
    const data = await getTopXXMovies(page, type, slug);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
