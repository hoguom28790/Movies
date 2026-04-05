import { NextRequest, NextResponse } from "next/server";
import { getJavDBActressProfile } from "@/services/scrapers/javdb";

/**
 * TOPXX ACTRESS AGGREGATE API - Optimized to prevent internal timeout loops
 * Priority: AVDB API (fastest) + JAVDB scraper (biography)
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const decodedName = decodeURIComponent(name).trim();
  console.log(`[TOPXX-ACTRESS] Aggregating data for: ${decodedName}`);

  // Fetch both sources in parallel for speed
  const avdbUrl = `https://avdbapi.com/api.php/provide/vod?ac=detail&at=json&vod_actor=${encodeURIComponent(decodedName)}&pg=1`;
  
  try {
    const [avdbRes, javdbData] = await Promise.all([
      fetch(avdbUrl, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : null).catch(() => null),
      getJavDBActressProfile(decodedName).catch(() => null)
    ]);

    const avdbMovies = avdbRes?.list || [];
    
    if (avdbMovies.length === 0 && !javdbData) {
        throw new Error("No data found from any source");
    }

    const firstMovie = avdbMovies[0] || {};
    const filmMap = new Map<string, any>();

    // 1. Add AVDB movies to map
    avdbMovies.forEach((m: any) => {
      const code = m.movie_code || m.slug || m.id?.toString();
      if (code) {
        filmMap.set(code, {
          code: code,
          title: m.name || "No Title",
          poster: m.poster_url || m.thumb_url || "",
          year: m.year || "N/A",
          rating: "N/A",
          slug: `av-${m.id}`,
          source: "avdb",
        });
      }
    });

    // 2. Add JAVDB movies to map (deduplicate by code)
    if (javdbData?.filmography) {
      javdbData.filmography.forEach((f: any) => {
        if (!filmMap.has(f.code)) {
          filmMap.set(f.code, { ...f, source: "topxx" }); // Internal routing
        }
      });
    }

    const responseData = {
      source: (avdbMovies.length > 0 ? "AVDB" : "") + (javdbData ? (avdbMovies.length > 0 ? " + " : "") + "JAVDB" : ""),
      stageName: javdbData?.stageName || decodedName,
      realName: javdbData?.realName || firstMovie.vod_actor || decodedName,
      birthDate: javdbData?.birthDate || "N/A",
      measurements: javdbData?.measurements || "N/A",
      cupSize: javdbData?.cupSize || "N/A",
      height: javdbData?.height || "N/A",
      weight: javdbData?.weight || "N/A",
      birthPlace: javdbData?.birthPlace || "N/A",
      studio: firstMovie.vod_area || javdbData?.studio || "N/A",
      debutYear: javdbData?.debutYear || "N/A",
      status: javdbData?.status || "Active",
      profileImage: javdbData?.profileImage || firstMovie.vod_pic || "",
      gallery: javdbData?.gallery || (firstMovie.vod_pic ? [firstMovie.vod_pic] : []),
      filmography: Array.from(filmMap.values()),
    };

    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("[TOPXX-ACTRESS] All sources failed for:", decodedName, e.message);
    return NextResponse.json({
      source: "fallback",
      stageName: decodedName,
      realName: "Đang cập nhật",
      birthDate: "N/A",
      measurements: "N/A",
      height: "N/A",
      birthPlace: "N/A",
      studio: "N/A",
      debutYear: "N/A",
      status: "Active",
      profileImage: `https://placehold.co/300x450/0f1115/ffffff?text=${encodeURIComponent(decodedName)}`,
      gallery: [],
      filmography: [],
      toast: "Không thể lấy dữ liệu diễn viên lúc này.",
    });
  }
}
