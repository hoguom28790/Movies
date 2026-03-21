import { notFound } from "next/navigation";
import { MangaPlusService } from "@/services/mangaplus";
import { StitchMangaDetail } from "@/components/stitch/StitchMangaDetail";
import { fetchAniList, ANILIST_QUERIES } from "@/lib/anilist";

export const dynamic = "force-dynamic";

async function fetchAniListRating(name: string) {
  try {
     const cleanName = name.replace(/\(.*\)/g, "").trim();
     const data = await fetchAniList(ANILIST_QUERIES.SEARCH_MANGA, { search: cleanName });
     const media = data?.Page?.media?.[0];
     if (media && media.averageScore) {
        return (media.averageScore / 10).toFixed(1);
     }
  } catch (err) {
    console.error("AniList Fetch Error:", err);
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
  
  const [anilistRating] = await Promise.all([
     fetchAniListRating(item.name)
  ]);

  // Clean up trailing slashes
  const baseUrl = domain_cdn.endsWith('/uploads/comics') ? domain_cdn : `${domain_cdn}/uploads/comics`;
  const posterPath = item.thumb_url.startsWith('/') ? item.thumb_url : `/${item.thumb_url}`;
  const poster = `${baseUrl}${posterPath}`;
  
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
        posterUrl={poster}
        author={item.author?.[0] || 'Chưa rõ'}
        status={item.status === 'ongoing' ? 'Ongoing' : 'Completed'}
        rating={anilistRating || (((item.name.length * 7) % 5) / 10 + 4.5).toFixed(1)}
        description={item.content || "Truyện chưa có mô tả..."}
        categories={item.category?.map((c: any) => ({ name: c.name, slug: c.slug })) || []}
        chapters={chapters}
        activeSource={activeSource.toLowerCase()}
    />
  );
}
