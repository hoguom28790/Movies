import { notFound } from "next/navigation";
import { MangaPlusService } from "@/services/mangaplus";
import { StitchReader } from "@/components/stitch/StitchReader";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string, chapter: string }>, searchParams: Promise<{ source?: string }> }) {
  const { slug, chapter } = await params;
  const sParams = await searchParams;
  const source = sParams.source || "otruyen";

  try {
    if (source === "otruyen") {
      const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
      const data = await res.json();
      if (data.status === "success" && data.data?.item) {
        return {
          title: `Đọc Chương ${chapter} - ${data.data.item.name} - Hồ Truyện`,
        };
      }
    } else {
      return { title: `Đọc Chương ${chapter} - ${slug} (${source.toUpperCase()}) - Hồ Truyện` };
    }
  } catch (err) {}
  return { title: `Đọc Chương ${chapter} - Hồ Truyện` };
}

export default async function ComicReadingPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string, chapter: string }>;
  searchParams: Promise<{ server?: string, source?: string }>;
}) {
  const { slug, chapter } = await params;
  const sParams = await searchParams;
  const activeSource = (sParams.source?.toLowerCase() === "mangaplus" ? "MangaPlus" : 
                        sParams.source?.toLowerCase() === "mangadex" ? "MangaDex" : "OTruyen");

  let images: string[] = [];
  let chaptersList: string[] = [];
  let item: any = { name: slug.replace(/-/g, " "), thumb_url: "" };

  try {
    const otruyenRes = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    if (otruyenRes.ok) {
        const otruyenData = await otruyenRes.json();
        if (otruyenData.status === "success" && otruyenData.data?.item) {
            item = otruyenData.data.item;
            chaptersList = item.chapters[0]?.server_data?.map((c: any) => c.chapter_name) || [];
        }
    }
  } catch (e) {}

  // Multi-source engine
  try {
    if (activeSource === "MangaPlus") {
      const mpTitle = await MangaPlusService.searchTitle(item.name, 8);
      if (mpTitle) {
        const detail = await MangaPlusService.getTitleDetail(mpTitle.id);
        if (detail && detail.chapters.length > 0) {
          const cleanChap = chapter.replace("Chương ", "").trim();
          const mpChap = detail.chapters.find((c: any) => c.name === cleanChap || c.name === chapter);
          if (mpChap) {
            images = await MangaPlusService.getPages(mpChap.id);
            if (images.length > 0) {
              chaptersList = detail.chapters.map((c: any) => c.name);
            }
          }
        }
      }
    } else if (activeSource === "MangaDex") {
       const mdSearch = await fetch(`https://api.mangadex.org/manga?title=${slug.replace(/-/g, " ")}&limit=1&contentRating[]=safe&contentRating[]=suggestive`);
       const mdSearchData = await mdSearch.json();
       const mangaId = mdSearchData.data?.[0]?.id;
       if (mangaId) {
          const cleanChap = chapter.replace("Chương ", "").trim();
          const feedRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=vi&order[chapter]=desc&limit=100&chapter=${cleanChap}`);
          const feedData = await feedRes.json();
          const targetChap = feedData.data?.find((c: any) => c.attributes.chapter === cleanChap);
          if (targetChap) {
             const atHomeRes = await fetch(`https://api.mangadex.org/at-home/server/${targetChap.id}`);
             const atHomeData = await atHomeRes.json();
             const base = atHomeData.baseUrl;
             const hash = atHomeData.chapter.hash;
             images = atHomeData.chapter.data.map((img: string) => `${base}/data/${hash}/${img}`);
          }
       }
    } else if (activeSource === "OTruyen") {
        const serverData = item.chapters[0]?.server_data || [];
        const currentChapterInfo = serverData.find((c: any) => c.chapter_name === chapter);
        
        if (currentChapterInfo) {
          const chapRes = await fetch(currentChapterInfo.chapter_api_data);
          const chapData = await chapRes.json();
          if (chapData.status === "success" && chapData.data?.item) {
            images = chapData.data.item.chapter_image.map((img: any) => 
              `${chapData.data.domain_cdn}/${chapData.data.item.chapter_path}/${img.image_file}`
            );
          }
        }
    }
  } catch (error) {
    console.error("Multi-source reader fetch failed:", error);
  }

  if (images.length === 0) return notFound();

  const media = {
    id: item._id || slug,
    title: item.name,
    imageUrl: item.thumb_url,
    chapters: images,
    currentChapterIndex: chaptersList.indexOf(chapter) !== -1 ? chaptersList.indexOf(chapter) : 0,
    slug: slug
  };

  return (
    <StitchReader media={media} />
  );
}
