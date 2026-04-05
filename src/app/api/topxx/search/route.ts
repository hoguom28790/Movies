import { NextResponse } from "next/server";
import { searchTopXXMovies } from "@/services/api/topxx";
import { getAVDBMovies } from "@/services/api/avdb";

const BASE_URL = "https://topxx.vip/api/v1";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const type = searchParams.get("type") || "movies";

  if (!keyword) {
    return NextResponse.json({ items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 1 } });
  }

  try {
    if (type === "actors") {
      // Specialized Actor Search
      const actorUrl = `${BASE_URL}/actors?search=${encodeURIComponent(keyword)}&page=${page}`;
      const res = await fetch(actorUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return NextResponse.json({ items: [] });
      const data = await res.json();
      
      const actors = (data.data || []).map((a: any) => ({
        id: a.trans?.[0]?.slug || a.id,
        name: a.name || a.trans?.[0]?.name,
        profilePath: a.thumbnail || a.avatar || (a.trans?.[0]?.thumbnail),
        type: 'topxx'
      }));

      return NextResponse.json({
        items: actors,
        pagination: {
          totalItems: data.meta?.total || actors.length,
          totalPages: data.meta?.last_page || 1,
          currentPage: page
        }
      });
    }

    // Search from both sources in parallel (Movies)
    const [topxxResults, avdbResults] = await Promise.allSettled([
      searchTopXXMovies(keyword, page),
      getAVDBMovies(page, undefined, keyword),
    ]);

    const topxxItems = topxxResults.status === "fulfilled" ? topxxResults.value.items : [];
    const avdbItems = avdbResults.status === "fulfilled" ? avdbResults.value.items : [];
    const topxxPagination = topxxResults.status === "fulfilled" ? topxxResults.value.pagination : null;
    const avdbPagination = avdbResults.status === "fulfilled" ? avdbResults.value.pagination : null;

    // Merge and deduplicate by title similarity
    const mergedMap = new Map<string, any>();

    // Add topxx results first (priority)
    topxxItems.forEach((item) => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      mergedMap.set(key, item);
    });

    // Add avdb results that aren't duplicates
    avdbItems.forEach((item) => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, item);
      }
    });

    const mergedItems = Array.from(mergedMap.values())
      .sort((a, b) => {
        const yearA = parseInt(a.year || a.vod_year || "0");
        const yearB = parseInt(b.year || b.vod_year || "0");
        if (yearB !== yearA) return yearB - yearA;
        // Secondary sort by ID if years are same
        return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
      });

    const totalItems = (topxxPagination?.totalItems || 0) + (avdbPagination?.totalItems || 0);
    const totalPages = Math.max(topxxPagination?.totalPages || 1, avdbPagination?.totalPages || 1);

    return NextResponse.json({
      items: mergedItems,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("TopXX Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
