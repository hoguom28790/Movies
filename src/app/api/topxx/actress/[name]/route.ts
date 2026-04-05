import { NextRequest, NextResponse } from "next/server";
import { getBoobpediaProfile } from "@/services/scrapers/boobpedia";
import { getJavCubeProfile } from "@/services/scrapers/javcube";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const rawName = decodeURIComponent(name).trim();
  const decodedName = rawName.replace(/[-_]+/g, " ");
  const lowerName = decodedName.toLowerCase();
  console.log(`[TOPXX-ACTRESS] Aggregating data for: ${decodedName} (Original: ${rawName})`);

  // Fetch from multiple sources for maximum data coverage
  const avdbUrl = `https://avdbapi.com/api.php/provide/vod?ac=detail&at=json&wd=${encodeURIComponent(decodedName)}&pg=1`;
  
  try {
    const [avdbRes, boobpediaBio, javCubeBio] = await Promise.all([
      fetch(avdbUrl, { cache: "force-cache" }).then(r => r.ok ? r.json() : null).catch(() => null),
      getBoobpediaProfile(decodedName).catch(() => null),
      getJavCubeProfile(decodedName).catch(() => null)
    ]);

    // Merge strategy: Boobpedia (best descriptive info) + JavCube (best coverage for missing stars)
    let bioData = boobpediaBio;
    if (!bioData || !bioData.measurements) {
        if (javCubeBio) {
            bioData = {
                ...(bioData || {}),
                ...(javCubeBio as any),
                // Keep Boobpedia image if it exists (usually better quality)
                profileImage: bioData?.profileImage || javCubeBio.profileImage || "",
                // Keep Boobpedia gallery if it exists
                gallery: bioData?.gallery || (javCubeBio.profileImage ? [javCubeBio.profileImage] : [])
            };
        }
    }

    const allAvdbMovies = avdbRes?.list || [];
    
    // Exact filter on the frontend since wd= search can be fuzzy
    const avdbMovies = allAvdbMovies.filter((m: any) => {
      const actorStr = Array.isArray(m.actor) ? m.actor.join(", ") : String(m.actor || "");
      const act = actorStr.toLowerCase();
      const n = decodedName.toLowerCase();
      // Handle "Yua Mikami" OR reverse "Mikami Yua" OR just parts if it matches
      return act.includes(n) || act.includes(n.split(" ").reverse().join(" ")) || m.name?.toLowerCase().includes(n);
    });
    
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
          title: m.name || m.vod_name || "No Title",
          poster: m.vod_pic || m.poster_url || m.thumb_url || "",
          year: m.year || m.vod_year || m.created_at?.split("-")[0] || "N/A",
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
      bodyType: bioData?.bodyType || "N/A",
      eyeColor: bioData?.eyeColor || "N/A",
      hairColor: bioData?.hairColor || "N/A",
      underarmHair: bioData?.underarmHair || "N/A",
      pubicHair: bioData?.pubicHair || "N/A",
      boobsType: bioData?.boobsType || "N/A",
      performanceShown: bioData?.performanceShown || "N/A",
      performanceSolo: bioData?.performanceSolo || "N/A",
      performanceBoyGirl: bioData?.performanceBoyGirl || "N/A",
      instagram: bioData?.instagram || "N/A",
      
      // Media
      profileImage: bioData?.profileImage || firstMovie.vod_pic || "",
      gallery: bioData?.gallery?.length ? bioData.gallery : avdbMovies.slice(0, 12).map((m: any) => m.vod_pic).filter(Boolean),
      
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
      bodyType: "N/A",
      eyeColor: "N/A",
      hairColor: "N/A",
      underarmHair: "N/A",
      pubicHair: "N/A",
      boobsType: "N/A",
      performanceShown: "N/A",
      performanceSolo: "N/A",
      performanceBoyGirl: "N/A",
      instagram: "N/A",
      profileImage: `https://placehold.co/300x450/0f1115/eab308?text=${encodeURIComponent(decodedName.charAt(0))}`,
      gallery: [],
      filmography: [],
      toast: "Không thể lấy dữ liệu diễn viên lúc này.",
    });
  }
}
