import { ComicCard } from "@/components/comic/ComicCard";
import { BookOpen, Flame } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hồ Truyện - Đọc Truyện Tranh",
  description: "Web đọc truyện tranh cá nhân, cập nhật liên tục.",
};

async function getComics(type: "sắp xếp mới cập nhật" | "truyen-moi" | "dang-phat-hanh" | "hoan-thanh") {
  // Use proxy since OTruyen might have internal stuff, but for server side fetch direct OTruyen is fine
  const res = await fetch(`https://otruyenapi.com/v1/api/danh-sach/${type}?page=1`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return { items: [], domain_cdn: "" };
  const data = await res.json();
  const domain_cdn = data?.data?.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
  return { items: data?.data?.items || [], domain_cdn };
}

export default async function ComicHomePage() {
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
         
         <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
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
         
         <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
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
