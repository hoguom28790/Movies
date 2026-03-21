import { ComicReader } from "@/components/comic/ComicReader";
import { notFound } from "next/navigation";
import { MangaPlusService } from "@/services/mangaplus";

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

  // Default OTruyen fetching
  const otruyenRes = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
  if (!otruyenRes.ok) return notFound();
  const otruyenData = await otruyenRes.json();
  if (otruyenData.status !== "success" || !otruyenData.data?.item) return notFound();

  const item = otruyenData.data.item;
  const domain_cdn = otruyenData.data.APP_DOMAIN_CDN_IMAGE || "https://img.otruyenapi.com";
  const poster = item.thumb_url.startsWith('http') 
    ? item.thumb_url 
    : `${domain_cdn}/uploads/comics/${item.thumb_url.startsWith('/') ? item.thumb_url.substring(1) : item.thumb_url}`;

  // Multi-source engine: OTruyen + MangaDex + MangaPlus
  let images: string[] = [];
  let availableServers = item.chapters.map((c: any) => c.server_name);
  let chaptersList = item.chapters[0]?.server_data?.map((c: any) => c.chapter_name) || [];
  let activeServerName = sParams.server || availableServers[0];

  try {
    if (activeSource === "MangaPlus") {
      // Find title on MangaPlus (search by name)
      const mpTitle = await MangaPlusService.searchTitle(item.name);
      if (mpTitle) {
        const detail = await MangaPlusService.getTitleDetail(mpTitle.id);
        if (detail && detail.chapters.length > 0) {
          // Find matching chapter. MangaPlus names are usually "245", "1".
          const mpChap = detail.chapters.find((c: any) => c.name === chapter || c.name === chapter.replace("Chương ", ""));
          if (mpChap) {
            images = await MangaPlusService.getPages(mpChap.id);
            // If images found, we use this source. Else fallback.
            if (images.length > 0) {
              chaptersList = detail.chapters.map((c: any) => c.name);
              activeServerName = "MangaPlus Official";
            }
          }
        }
      }
      
      // If we couldn't get MangaPlus data, we fallback to OTruyen
      if (images.length === 0) {
        // Fallback logic implemented below by checking if (images.length === 0)
      }
    }
  } catch (error) {
    console.error("MangaPlus fetch failed:", error);
  }

  // Final Fallback to OTruyen if no images yet
  if (images.length === 0) {
    const activeServerInfo = item.chapters.find((c: any) => c.server_name === activeServerName) || item.chapters[0];
    const serverData = activeServerInfo.server_data || [];
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

  if (images.length === 0) return notFound();

  return (
    <ComicReader 
      slug={slug}
      title={item.name}
      posterUrl={poster}
      chapter={chapter}
      images={images}
      chaptersList={chaptersList}
      servers={availableServers}
      currentServer={activeServerName}
      activeSource={activeSource}
    />
  );
}
