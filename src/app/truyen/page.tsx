import { ComicCard } from "@/components/comic/ComicCard";
import { BookOpen, Flame } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hồ Truyện - Đọc Truyện Tranh",
  description: "Web đọc truyện tranh cá nhân, cập nhật liên tục.",
};

async function getComics(type: string, isGenre = false) {
  const url = isGenre 
    ? `https://otruyenapi.com/v1/api/the-loai/${type}?page=1`
    : `https://otruyenapi.com/v1/api/danh-sach/${type}?page=1`;
    
  const res = await fetch(url, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return { items: [], domain_cdn: "" };
  const data = await res.json();
  const domain_cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
  return { items: data?.data?.items || [], domain_cdn };
}

export default async function ComicHomePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; status?: string }>;
}) {
  const params = await searchParams;
  const genre = params.genre;
  const status = params.status;
  
  const isFiltering = !!(genre || (status && status !== "all"));

  if (isFiltering) {
    // Determine the primary API to call. Genre takes priority because it's narrower.
    let items: any[] = [];
    let domain: string = "";
    
    if (genre) {
      const res = await getComics(genre, true);
      items = res.items;
      domain = res.domain_cdn;
      
      // If status is also selected, filter locally (best effort mapping since API doesn't support dual filtering natively)
      if (status && status !== "all") {
        const localStatusKey = status === "dang-phat-hanh" ? "Ongoing" : "Completed";
        items = items.filter((item: any) => item.status === localStatusKey || item.status === status);
      }
    } else if (status && status !== "all") {
      const res = await getComics(status, false);
      items = res.items;
      domain = res.domain_cdn;
    }

    return (
      <div className="flex flex-col gap-16 pb-20 mt-[-20px] max-w-7xl mx-auto px-4 md:px-0">
        <section className="space-y-6 pt-10">
           <div className="flex items-center gap-3 relative">
              <div className="absolute -left-4 md:-left-8 -top-8 w-24 h-24 bg-primary/20 blur-[50px] rounded-full" />
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" />
              <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase relative z-10">
                Kết Quả Lọc
              </h2>
           </div>
           
           {items.length > 0 ? (
             <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {items.map((comic: any) => (
                  <ComicCard
                    key={comic._id}
                    title={comic.name}
                    slug={comic.slug}
                    posterUrl={`${domain}/uploads/comics/${comic.thumb_url}`}
                    latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                    originalTitle={comic.origin_name?.[0] || ""}
                  />
                ))}
             </div>
           ) : (
             <div className="py-20 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
               Không tìm thấy truyện nào khớp với bộ lọc của bạn.
             </div>
           )}
        </section>
      </div>
    );
  }

  // Default Home Page View
  const { items: newComics, domain_cdn } = await getComics("truyen-moi");
  const { items: ongoingComics, domain_cdn: ongoingCdn } = await getComics("dang-phat-hanh");

  return (
    <div className="flex flex-col gap-16 pb-20 mt-[-20px] max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Mới Cập Nhật */}
      <section className="space-y-6 pt-10">
         <div className="flex items-center gap-3 relative">
            <div className="absolute -left-4 md:-left-8 -top-8 w-24 h-24 bg-primary/20 blur-[50px] rounded-full" />
            <Flame className="w-8 h-8 md:w-10 md:h-10 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" />
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase relative z-10">Mới Cập Nhật</h2>
         </div>
         
         <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {newComics.slice(0, 12).map((comic: any) => (
              <ComicCard
                key={comic._id}
                title={comic.name}
                slug={comic.slug}
                posterUrl={`${domain_cdn}/uploads/comics/${comic.thumb_url}`}
                latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                originalTitle={comic.origin_name?.[0] || ""}
              />
            ))}
         </div>
      </section>

      {/* Đang Phát Hành */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 relative">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10" />
            <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase relative z-10">Đang Phát Hành</h2>
         </div>
         
         <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {ongoingComics.slice(0, 12).map((comic: any) => (
              <ComicCard
                key={comic._id}
                title={comic.name}
                slug={comic.slug}
                posterUrl={`${ongoingCdn}/uploads/comics/${comic.thumb_url}`}
                latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                originalTitle={comic.origin_name?.[0] || ""}
              />
            ))}
         </div>
      </section>

    </div>
  );
}
