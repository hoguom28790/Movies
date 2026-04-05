import { NextRequest, NextResponse } from "next/server";
import { getBoobpediaProfile } from "@/services/scrapers/boobpedia";

/**
 * TOPXX ACTRESS AGGREGATE API
 * Priority: AVDB API (filmography) + Boobpedia (bio, measurements, profile image)
 * 
 * Boobpedia is used because JavDB mirrors are blocked from Vercel servers.
 * Boobpedia has detailed bio data: measurements, cup size, height, weight, blood type.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const decodedName = decodeURIComponent(name).trim();
  console.log(`[TOPXX-ACTRESS] Aggregating data for: ${decodedName}`);

  // Fetch AVDB for filmography and Boobpedia for bio in parallel
  const avdbUrl = `https://avdbapi.com/api.php/provide/vod?ac=detail&at=json&vod_actor=${encodeURIComponent(decodedName)}&pg=1`;
  
  try {
    const [avdbRes, bioData] = await Promise.all([
      fetch(avdbUrl, { cache: "force-cache" }).then(r => r.ok ? r.json() : null).catch(() => null),
      getBoobpediaProfile(decodedName).catch(() => null)
    ]);

    const avdbMovies = avdbRes?.list || [];
    
    if (avdbMovies.length === 0 && !bioData) {
        throw new Error("No data found from any source");
    }

    const firstMovie = avdbMovies[0] || {};
    const filmMap = new Map<string, any>();

    // Build filmography map from AVDB
    avdbMovies.forEach((m: any) => {
      const code = m.movie_code || m.slug || m.id?.toString();
      if (code) {
        filmMap.set(code, {
          code: code,
          title: m.name || "No Title",
          poster: m.poster_url || m.thumb_url || "",
          year: m.year || m.created_at?.split("-")[0] || "N/A",
          rating: "N/A",
          slug: `av-${m.id}`,
          source: "avdb",
        });
      }
    });

    const responseData = {
      source: [
        avdbMovies.length > 0 ? "AVDB" : "",
        bioData ? "Boobpedia" : ""
      ].filter(Boolean).join(" + "),
      
      // Name info
      stageName: bioData?.stageName || decodedName,
      realName: bioData?.realName || firstMovie.vod_actor || decodedName,
      
      // Bio from Boobpedia
      birthDate: bioData?.birthDate || "N/A",
      measurements: bioData?.measurements || "N/A",
      bust: bioData?.bust || "N/A",
      waist: bioData?.waist || "N/A",
      hips: bioData?.hips || "N/A",
      cupSize: bioData?.cupSize || "N/A",
      height: bioData?.height || "N/A",
      weight: bioData?.weight || "N/A",
      bloodType: bioData?.bloodType || "N/A",
      birthPlace: bioData?.birthPlace || firstMovie.vod_area || "N/A",
      nationality: bioData?.nationality || "N/A",
      ethnicity: bioData?.ethnicity || "N/A",
      yearsActive: bioData?.yearsActive || "N/A",
      studio: firstMovie.vod_area || bioData?.studio || "N/A",
      debutYear: bioData?.debutYear || "N/A",
      status: bioData?.status || "Active",
      
      // Media
      profileImage: bioData?.profileImage || firstMovie.vod_pic || "",
      gallery: bioData?.gallery || (firstMovie.vod_pic ? [firstMovie.vod_pic] : []),
      
      // Filmography primarily from AVDB
      filmography: Array.from(filmMap.values()),
    };

    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("[TOPXX-ACTRESS] All sources failed for:", decodedName, e.message);
    return NextResponse.json({
      source: "fallback",
      stageName: decodedName,
      realName: "N/A",
      birthDate: "N/A",
      measurements: "N/A",
      bust: "N/A",
      waist: "N/A",
      hips: "N/A",
      cupSize: "N/A",
      height: "N/A",
      weight: "N/A",
      bloodType: "N/A",
      birthPlace: "N/A",
      nationality: "N/A",
      ethnicity: "N/A",
      yearsActive: "N/A",
      studio: "N/A",
      debutYear: "N/A",
      status: "Active",
      profileImage: `https://placehold.co/300x450/0f1115/eab308?text=${encodeURIComponent(decodedName.charAt(0))}`,
      gallery: [],
      filmography: [],
      toast: "Không thể lấy dữ liệu diễn viên lúc này.",
    });
  }
}
