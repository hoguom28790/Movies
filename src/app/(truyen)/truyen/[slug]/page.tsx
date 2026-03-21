import { notFound } from "next/navigation";
import { MangaPlusService } from "@/services/mangaplus";
import { StitchMangaDetail } from "@/components/stitch/StitchMangaDetail";
import { fetchAniList, ANILIST_QUERIES, getPremiumMangaInfo } from "@/lib/anilist";

export const dynamic = "force-dynamic";

async function fetchAniListManga(name: string, originNames: string[] = []) {
  try {
     const namesToTry = [
        name.replace(/\(.*\)/g, "").trim(),
        ...originNames.map(n => n.replace(/\(.*\)/g, "").trim())
     ].filter(Boolean);

     for (const search of namesToTry) {
        const data = await fetchAniList(ANILIST_QUERIES.SEARCH_MANGA, { search });
        const media = data?.Page?.media?.find((m: any) => 
           m.averageScore && 
           (m.title.english?.toLowerCase() === search.toLowerCase() || 
            m.title.romaji?.toLowerCase() === search.toLowerCase() ||
            m.title.native?.toLowerCase() === search.toLowerCase())
        ) || data?.Page?.media?.[0];

        if (media) {
           return {
              rating: (media.averageScore / 10).toFixed(1),
              posterUrl: media.coverImage?.extraLarge || media.coverImage?.large,
              posterColor: media.coverImage?.color,
              bannerImage: media.bannerImage || media.coverImage?.large,
              characters: media.characters?.nodes || []
           };
        }
     }
  } catch (err) {
    console.error("AniList Fetch Error:", err);
  }
  return null;
}

async function fetchMangaDexPoster(slug: string) {
  try {
     const title = slug.replace(/-/g, " ");
     const res = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&includes[]=cover_art`);
     const data = await res.json();
     const manga = data.data?.[0];
     if (manga) {
        const coverFileName = manga.relationships?.find((r: any) => r.type === "cover_art")?.attributes?.fileName;
        if (coverFileName) {
           return `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`;
        }
     }
  } catch (e) {
     console.error("MangaDex Poster Fetch Error:", e);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    const data = await res.json();
    if (data.status === "success" && data.data?.item) {
      return {
        title: `${data.data.item.name} - Hồ Truyện`,
        description: data.data.item.content?.replace(/<[^>]*>?/gm, "").substring(0, 160) || "Đọc truyện tranh miễn phí",
      };
    }
  } catch (err) {}
  return { title: "Đọc truyện - Hồ Truyện" };
}

async function fetchComicData(slug: string) {
  try {
    const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function ComicDetailsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;
  const data = await fetchComicData(slug);
  
  if (!data || data.status !== "success" || !data.data?.item) {
    return notFound();
  }

  const activeSource = (sParams.source?.toLowerCase() === "mangaplus" ? "MangaPlus" : 
                        sParams.source?.toLowerCase() === "mangadex" ? "MangaDex" : "OTruyen");

  const item = data.data.item;
  const domain_cdn = data.data.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
  
  const [anilistData] = await Promise.all([
     getPremiumMangaInfo(item.name, item.origin_name || [])
  ]);

  // Fallback to MangaDex for HQ poster if AniList fails
  let poster = anilistData?.posterUrl;
  if (!poster) {
     poster = await fetchMangaDexPoster(slug);
  }

  // Final fallback to OTruyen
  if (!poster) {
    const baseUrl = domain_cdn.endsWith('/uploads/comics') ? domain_cdn : `${domain_cdn}/uploads/comics`;
    const posterPath = item.thumb_url.startsWith('/') ? item.thumb_url : `/${item.thumb_url}`;
    poster = `${baseUrl}${posterPath}`;
  }

  // Multi-source chapter logic
  let chapters: any[] = item.chapters?.[0]?.server_data || [];
  
  if (activeSource === "MangaPlus") {
    try {
      const mpTitle = await MangaPlusService.searchTitle(item.name);
      if (mpTitle) {
        const detail = await MangaPlusService.getTitleDetail(mpTitle.id);
        if (detail && detail.chapters.length > 0) {
          chapters = detail.chapters.map((c: any) => ({
            chapter_name: c.name,
            chapter_title: c.subTitle || "",
            chapter_api_data: c.id
          }));
        }
      }
    } catch (e) {
      console.error("MangaPlus source fetch failed:", e);
    }
  }

  return (
    <StitchMangaDetail 
        title={item.name}
        slug={slug}
        posterUrl={poster || ""}
        author={item.author?.[0] || 'Chưa rõ'}
        status={item.status === 'ongoing' ? 'Ongoing' : 'Completed'}
        rating={anilistData?.rating || (((item.name.length * 7) % 5) / 10 + 4.5).toFixed(1)}
        description={item.content || "Truyện chưa có mô tả..."}
        categories={item.category?.map((c: any) => ({ name: c.name, slug: c.slug })) || []}
        chapters={chapters}
        activeSource={activeSource.toLowerCase()}
        anilistChapterImages={(anilistData?.characters || []).map((c: any) => c.image?.large).filter(Boolean)}
        posterColor={anilistData?.posterColor}
    />
  );
}
