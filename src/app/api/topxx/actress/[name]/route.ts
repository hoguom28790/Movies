import { NextRequest, NextResponse } from "next/server";

/**
 * TOPXX ACTRESS AGGREGATE API
 * Priority: AVDB API (fastest) → JAVDB scraper → JavLibrary scraper
 * Returns unified actress profile for ActorProfile component.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const decodedName = decodeURIComponent(name).trim();
  const origin = req.nextUrl.origin;

  console.log(`[TOPXX-ACTRESS] Fetching profile for: ${decodedName}`);

  // ── 1. AVDB SOURCE ──────────────────────────────────────────────
  try {
    const avdbRes = await fetch(
      `https://avdbapi.com/api.php/provide/vod?ac=detail&at=json&vod_actor=${encodeURIComponent(decodedName)}&pg=1`,
      { next: { revalidate: 3600 } }
    );

    if (avdbRes.ok) {
      const avdbData = await avdbRes.json();
      const movies = avdbData?.list || [];

      if (movies.length > 0) {
        // Aggregate from first actress match in results
        const firstMovie = movies[0];

        // Gather filmography list
        const filmography = movies.map((m: any) => ({
          code: m.movie_code || m.slug || m.id?.toString() || "",
          title: m.name || "No Title",
          poster: m.poster_url || m.thumb_url || "",
          year: m.year || "N/A",
          rating: "N/A",
          slug: `av-${m.id}`,
          source: "avdb",
        })).filter((m: any) => m.code || m.title);

        // Get more info from JAVDB as supplement
        let supplement: any = {};
        try {
          const javdbRes = await fetch(
            `${origin}/api/javdb/actress/${encodeURIComponent(decodedName)}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (javdbRes.ok) {
            supplement = await javdbRes.json();
            console.log(`[TOPXX-ACTRESS] JAVDB supplement fetched for ${decodedName}`);
          }
        } catch (e) {
          console.warn("[TOPXX-ACTRESS] JAVDB supplement failed, using AVDB only");
        }

        // Merge filmographies (dedupe by code)
        const filmMap = new Map<string, any>();
        filmography.forEach((f: any) => filmMap.set(f.code, f));
        if (supplement.filmography?.length > 0) {
          supplement.filmography.forEach((f: any) => {
            if (!filmMap.has(f.code)) filmMap.set(f.code, { ...f, source: "javdb" });
          });
        }

        const merged = {
          source: "avdb" + (supplement.source ? " + " + supplement.source : ""),
          stageName: supplement.stageName || decodedName,
          realName: supplement.realName || firstMovie.vod_actor || decodedName,
          birthDate: supplement.birthDate || "N/A",
          measurements: supplement.measurements || "N/A",
          height: supplement.height || "N/A",
          birthPlace: supplement.birthPlace || "N/A",
          studio: firstMovie.vod_area || supplement.studio || "N/A",
          debutYear: supplement.debutYear || "N/A",
          status: supplement.status || "Active",
          profileImage: supplement.profileImage || firstMovie.vod_pic || "",
          gallery: supplement.gallery || (firstMovie.vod_pic ? [firstMovie.vod_pic] : []),
          filmography: Array.from(filmMap.values()),
        };

        console.log(`[TOPXX-ACTRESS] AVDB returned ${merged.filmography.length} titles`);
        return NextResponse.json(merged);
      }
    }
  } catch (e: any) {
    console.warn("[TOPXX-ACTRESS] AVDB failed:", e.message);
  }

  // ── 2. JAVDB SOURCE ─────────────────────────────────────────────
  try {
    const javdbRes = await fetch(
      `${origin}/api/javdb/actress/${encodeURIComponent(decodedName)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (javdbRes.ok) {
      const javdbData = await javdbRes.json();
      if (javdbData.filmography?.length > 0 || javdbData.stageName) {
        console.log(`[TOPXX-ACTRESS] JAVDB returned ${javdbData.filmography?.length ?? 0} titles`);
        // Add source tag on each film for routing
        if (javdbData.filmography) {
          javdbData.filmography = javdbData.filmography.map((f: any) => ({
            ...f,
            source: "topxx",
          }));
        }
        return NextResponse.json({ ...javdbData, source: "javdb" });
      }
    }
  } catch (e: any) {
    console.warn("[TOPXX-ACTRESS] JAVDB failed:", e.message);
  }

  // ── 3. JAVLIBRARY FALLBACK ──────────────────────────────────────
  try {
    const javlRes = await fetch(
      `${origin}/api/javlibrary/actress/${encodeURIComponent(decodedName)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (javlRes.ok) {
      const javlData = await javlRes.json();
      console.log(`[TOPXX-ACTRESS] JavLibrary returned ${javlData.filmography?.length ?? 0} titles`);
      if (javlData.filmography) {
        javlData.filmography = javlData.filmography.map((f: any) => ({
          ...f,
          source: "topxx",
        }));
      }
      return NextResponse.json({ ...javlData, source: "javlibrary" });
    }
  } catch (e: any) {
    console.warn("[TOPXX-ACTRESS] JavLibrary failed:", e.message);
  }

  // ── FINAL FALLBACK ───────────────────────────────────────────────
  console.error("[TOPXX-ACTRESS] All sources failed for:", decodedName);
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
    toast: "Không thể tải thông tin diễn viên. Vui lòng thử lại sau.",
  });
}
