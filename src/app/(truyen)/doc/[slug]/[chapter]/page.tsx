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

  // Default values
  let images: string[] = [];
  let chaptersList: string[] = [];
  let availableServers: string[] = [];
  let activeServerName = sParams.server || "";
  let item: any = { name: slug.replace(/-/g, " "), thumb_url: "" };
  let poster = "";

  // Fetch OTruyen data (as base meta or as primary source)
  try {
    const otruyenRes = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    if (otruyenRes.ok) {
        const otruyenData = await otruyenRes.json();
        if (otruyenData.status === "success" && otruyenData.data?.item) {
            item = otruyenData.data.item;
            const domain_cdn = otruyenData.data.APP_DOMAIN_CDN_IMAGE || "https://img.otruyenapi.com";
            poster = item.thumb_url.startsWith('http') 
              ? item.thumb_url 
              : `${domain_cdn}/uploads/comics/${item.thumb_url.startsWith('/') ? item.thumb_url.substring(1) : item.thumb_url}`;
            
            availableServers = item.chapters.map((c: any) => c.server_name);
            chaptersList = item.chapters[0]?.server_data?.map((c: any) => c.chapter_name) || [];
            if (!activeServerName) activeServerName = availableServers[0];
        }
    }
  } catch (e) {}

  if (!poster && activeSource === "OTruyen") return notFound();

  // Multi-source engine: OTruyen + MangaDex + MangaPlus
  try {
    if (activeSource === "MangaPlus") {
      // Find title on MangaPlus. One Piece Vietnamese = 8
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
              activeServerName = "MangaPlus Official";
            }
          }
        }
      }
    } else if (activeSource === "MangaDex") {
       // Search MD
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
             activeServerName = "MangaDex (VI)";
          }
       }
    }
  } catch (error) {
    console.error("Multi-source fetch failed:", error);
  }

  // Fetch from OTruyen ONLY IF activeSource is OTruyen
  if (activeSource === "OTruyen") {
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

  if (images.length === 0 && activeSource === "OTruyen") return notFound();

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
