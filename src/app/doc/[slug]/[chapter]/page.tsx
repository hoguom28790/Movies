import { ComicReader } from "@/components/comic/ComicReader";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string, chapter: string }> }) {
  const { slug, chapter } = await params;
  try {
    const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    const data = await res.json();
    if (data.status === "success" && data.data?.item) {
      return {
        title: `Đọc Chương ${chapter} - ${data.data.item.name} - Hồ Truyện`,
      };
    }
  } catch (err) {}
  return { title: `Đọc Chương ${chapter} - Hồ Truyện` };
}

export default async function ComicReadingPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string, chapter: string }>;
  searchParams: Promise<{ server?: string }>;
}) {
  const { slug, chapter } = await params;
  const sParams = await searchParams;
  
  // Fetch comic info to get the chapter_api_data URL 
  const res = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
  if (!res.ok) return notFound();
  
  const data = await res.json();
  if (data.status !== "success" || !data.data?.item) return notFound();

  const item = data.data.item;
  const domain_cdn = data.data.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
  const poster = `${domain_cdn}/${item.thumb_url}`;

  // Process servers
  const availableServers = item.chapters.map((c: any) => c.server_name);
  const requestedServer = sParams.server;
  const activeServerInfo = item.chapters.find((c: any) => c.server_name === requestedServer) || item.chapters[0];
  const activeServerName = activeServerInfo.server_name;
  
  const chaptersParams = activeServerInfo.server_data || [];
  
  // Find current chapter info
  const currentChapterInfo = chaptersParams.find((c: any) => c.chapter_name === chapter);
  if (!currentChapterInfo) return notFound();

  // Fetch actual images for this chapter
  const chapRes = await fetch(currentChapterInfo.chapter_api_data);
  const chapData = await chapRes.json();
  
  if (chapData.status !== "success" || !chapData.data?.item) return notFound();
  
  const images = chapData.data.item.chapter_image.map((img: any) => 
    `${chapData.data.domain_cdn}/${chapData.data.item.chapter_path}/${img.image_file}`
  );

  return (
    <ComicReader 
      slug={slug}
      title={item.name}
      posterUrl={poster}
      chapter={chapter}
      images={images}
      chaptersList={chaptersParams.map((c: any) => c.chapter_name)}
      servers={availableServers}
      currentServer={activeServerName}
    />
  );
}
