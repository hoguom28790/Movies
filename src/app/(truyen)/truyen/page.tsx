import { StitchHero } from "@/components/stitch/StitchHero";
import { StitchMangaGrid } from "@/components/stitch/StitchMangaGrid";
import { StitchMangaCard } from "@/components/stitch/StitchMangaCard";
import { BookOpen } from "lucide-react";

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

  const { items: newComics, domain_cdn } = await getComics("truyen-moi");
  const { items: hotComics, domain_cdn: hotCdn } = await getComics("dang-phat-hanh");

  if (isFiltering) {
    let items: any[] = [];
    let domain: string = "";
    
    if (genre) {
      const res = await getComics(genre, true);
      items = res.items;
      domain = res.domain_cdn;
      
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
      <div className="flex flex-col gap-16 pb-20 max-w-[1440px] mx-auto px-6 theme-truyen">
        <section className="space-y-8 pt-10">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-5xl font-black font-headline text-on-surface uppercase tracking-tighter">
                Kết Quả Lọc
              </h2>
           </div>
           
           {items.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {items.map((comic: any) => (
                  <StitchMangaCard
                    key={comic._id}
                    title={comic.name}
                    slug={comic.slug}
                    imageUrl={`${domain}/uploads/comics/${comic.thumb_url}`}
                    latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                    tags={comic.category?.map((c: any) => c.name) || []}
                  />
                ))}
             </div>
           ) : (
             <div className="py-20 text-center text-on-surface-variant/60 bg-surface-container-low rounded-2xl border border-outline-variant/10 font-body">
               Không tìm thấy truyện nào khớp với bộ lọc của bạn.
             </div>
           )}
        </section>
      </div>
    );
  }

  // Default Home Page View
  const heroComic = hotComics[0];
  const featuredComic = newComics[0];
  const secondaryComics = newComics.slice(1, 3);
  const trendComics = newComics.slice(3, 13);

  return (
    <div className="flex flex-col gap-0 pb-20 theme-truyen">
      
      {heroComic && (
        <StitchHero 
           title={heroComic.name}
           description="Một hành trình đơn độc qua những tầng địa ngục của ký ức, nơi ranh giới giữa thực tại và ảo mộng bị xóa nhòa bởi sắc đỏ của mặt trăng."
           imageUrl={`${hotCdn}/uploads/comics/${heroComic.thumb_url}`}
           slug={heroComic.slug}
        />
      )}

      {featuredComic && (
        <StitchMangaGrid 
          title="Mới Cập Nhật"
          featuredComic={{
            title: featuredComic.name,
            slug: featuredComic.slug,
            imageUrl: `${domain_cdn}/uploads/comics/${featuredComic.thumb_url}`,
            latestChapter: featuredComic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${featuredComic.chaptersLatest[0].chapter_name}` : "",
            tags: ["Hành Động", "Giả Tưởng"],
            isHot: true
          }}
          secondaryComics={secondaryComics.map((c: any) => ({
            title: c.name,
            slug: c.slug,
            imageUrl: `${domain_cdn}/uploads/comics/${c.thumb_url}`,
            tags: ["Tâm Lý", "Drama"]
          }))}
        />
      )}

      {/* Trends Section */}
      <section className="py-24 bg-surface-container-low px-6 lg:px-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-16">
            <span className="text-primary font-headline text-[10px] font-black tracking-[0.3em] uppercase block mb-2">Curated Collection</span>
            <h3 className="text-3xl md:text-5xl font-black font-headline text-on-surface uppercase tracking-tighter">Xu Hướng</h3>
          </div>
          
          <div className="flex overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-8 pb-8 md:pb-0 scrollbar-hide">
            {trendComics.map((comic: any, idx: number) => (
              <StitchMangaCard 
                key={comic._id}
                title={comic.name}
                slug={comic.slug}
                imageUrl={`${domain_cdn}/uploads/comics/${comic.thumb_url}`}
                variant="gallery"
                className={idx % 2 === 1 ? "md:mt-8" : idx % 4 === 3 ? "md:mt-12" : ""}
                tags={["Romance"]}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
