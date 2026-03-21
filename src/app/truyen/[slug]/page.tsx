import { notFound } from "next/navigation";
import Link from "next/link";
import { Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComicFavoriteBtn } from "@/components/comic/ComicFavoriteBtn";
import { ComicProgressDisplay } from "@/components/comic/ComicProgressDisplay";

export const dynamic = "force-dynamic";

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

export default async function ComicDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchComicData(slug);
  
  if (!data || data.status !== "success" || !data.data?.item) {
    return notFound();
  }

  const item = data.data.item;
  const domain_cdn = data.data.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
  
  // Clean up trailing slashes
  const baseUrl = domain_cdn.endsWith('/uploads/comics') ? domain_cdn : `${domain_cdn}/uploads/comics`;
  const posterPath = item.thumb_url.startsWith('/') ? item.thumb_url : `/${item.thumb_url}`;
  
  const poster = `${baseUrl}${posterPath}`;
  
  // They sometimes only have thumb_url, no separate backdrop. Use poster as blurred backdrop.
  const thumb = poster;

  const chapters = item.chapters?.[0]?.server_data || [];
  
  // Chapters often returned in descending order. Let's find chap 1 (index usually bottom if desc).
  // But safest is to find the object with lowest number. Just use the last index as first chap often.
  const firstChapter = chapters[chapters.length - 1]; 

  return (
    <div className="min-h-screen pb-safe">
      <div className="relative w-full h-[35vh] sm:h-[40vh] lg:h-[45vh] min-h-[250px] overflow-hidden">
        <img
          src={thumb}
          alt={item.name}
          className="w-full h-full object-cover object-top opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/30" />
      </div>

      <div className="container mx-auto px-4 lg:px-12 relative z-10 -mt-44 sm:-mt-52 lg:-mt-64 pb-20 md:pb-16 px-safe">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[280px] flex-shrink-0">
            <div className="relative w-[160px] sm:w-[200px] lg:w-full mx-auto lg:mx-0">
              <img
                src={poster}
                alt={item.name}
                className="w-full rounded-xl shadow-2xl shadow-black/60 aspect-[2/3] object-cover"
              />
            </div>

            <div className="flex flex-col items-center lg:items-stretch gap-3 mt-4">
              <div className="flex gap-2 w-full">
                {firstChapter ? (
                  <Link href={`/doc/${slug}/${firstChapter.chapter_name}`} className="flex-1">
                    <Button className="w-full h-[45px] rounded-xl gap-2 font-semibold text-[14px] bg-primary hover:bg-primary-hover transition-all">
                      <BookOpen className="w-5 h-5 fill-current" />
                      ĐỌC TỪ ĐẦU
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full h-[45px] rounded-xl bg-white/5 text-white/30 flex-1">
                    Đang cập nhật
                  </Button>
                )}
                <ComicFavoriteBtn slug={slug} title={item.name} posterUrl={poster} />
              </div>

              <div className="flex items-center justify-center gap-4 mt-2">
                <button className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                  Chia sẻ
                </button>
              </div>

              <ComicProgressDisplay slug={slug} />
            </div>

            <div className="mt-6 text-center lg:text-left">
              <h1 className="text-xl font-bold text-white leading-snug">{item.name}</h1>
              <p className="text-[13px] text-white/30 mt-0.5 italic">
                {item.origin_name?.[0] || 'Chưa rõ'}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-[11px] font-semibold">
                  {item.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/50 text-[11px] font-medium">
                  {item.author?.[0] || 'Đang cập nhật'}
                </span>
              </div>

              {item.category?.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 mt-3">
                  {item.category.map((g: any) => (
                    <Link
                      key={g.id || g.slug}
                      href={`/truyen?genre=${g.slug}`}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 text-white/40 font-medium hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-[13px] font-semibold text-white/60 mb-2">Giới thiệu:</h3>
              <div
                className="text-[13px] text-white/40 leading-relaxed max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent pr-2"
                dangerouslySetInnerHTML={{ __html: item.content || "Truyện chưa có mô tả..." }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 mt-8 lg:mt-0">
             <div className="bg-[#0a0a0a]/50 rounded-2xl border border-white/[0.06] p-4 sm:p-6 backdrop-blur-md">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-lg font-bold text-white/90">Danh sách chương</h2>
                   <span className="text-sm font-medium text-white/40">{chapters.length} Chương</span>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                    {chapters.map((chap: any) => (
                      <Link 
                        key={chap.chapter_api_data}
                        href={`/doc/${slug}/${chap.chapter_name}`}
                        className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.03] transition-colors"
                      >
                         <span className="text-white/80 font-medium text-[13px]">Chương {chap.chapter_name}</span>
                      </Link>
                    ))}
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
