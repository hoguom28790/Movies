import { NextResponse } from "next/server";
import { getCategoryMovies, getGenreMovies, getLatestMovies, getCountryMovies, getYearMovies, searchMovies } from "@/services/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); 
  const category = searchParams.get("category"); 
  const slug = searchParams.get("slug"); 
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    let result;

    if (type === "category" && category) {
      result = await getCategoryMovies(category as "phim-le" | "phim-bo" | "hoat-hinh", page);
    } else if (type === "latest") {
      result = await getLatestMovies(page);
    } else if (type === "genre" && slug) {
      result = await getGenreMovies(slug, page);
    } else if (type === "country" && slug) {
      result = await getCountryMovies(slug, page);
    } else if (type === "year" && slug) {
      result = await getYearMovies(slug, page);
    } else if (type === "search") {
      const keyword = searchParams.get("keyword");
      if (!keyword) return NextResponse.json({ error: "Missing keyword" }, { status: 400 });
      result = await searchMovies(keyword, page);
    } else {
      return NextResponse.json({ error: "Invalid type or missing parameters" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API GET movies Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
