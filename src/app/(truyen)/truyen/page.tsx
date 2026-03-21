import { StitchHero } from "@/components/stitch/StitchHero";
import { StitchMangaGrid } from "@/components/stitch/StitchMangaGrid";
import { StitchMangaCard } from "@/components/stitch/StitchMangaCard";
import { StitchAniListSync } from "@/components/stitch/StitchAniListSync";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hồ Truyện - Noir Edition",
  description: "Web đọc truyện tranh cá nhân, phong cách Noir Editorial.",
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
      <div className="flex flex-col gap-16 pb-20 max-w-7xl mx-auto px-6 md:px-24 theme-truyen pt-24 min-h-screen">
        <section className="space-y-12">
           <div className="flex flex-col gap-4">
              <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-xs opacity-60">Kết Phẩm Tuyển Chọn</span>
              <h2 className="text-5xl md:text-8xl font-black font-headline text-on-surface uppercase tracking-tighter leading-[0.8]">
                 Lọc Truyện
              </h2>
           </div>
           
           {items.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {items.map((comic: any) => (
                  <StitchMangaCard
                    key={comic._id}
                    title={comic.name}
                    slug={comic.slug}
                    imageUrl={`${domain}/uploads/comics/${comic.thumb_url}`}
                    lastChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Chapter ${comic.chaptersLatest[0].chapter_name}` : ""}
                    category={comic.category?.[0]?.name || "Manga"}
                    variant="horizontal"
                  />
                ))}
             </div>
           ) : (
             <div className="py-24 text-center text-on-surface-variant/40 border-2 border-dashed border-outline-variant/10 rounded-2xl flex flex-col items-center gap-6">
                <BookOpen size={48} className="opacity-20" />
                <p className="font-headline font-black text-3xl uppercase tracking-tighter opacity-50">Không có truyện nào ở đây</p>
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
  const trendComics = newComics.slice(3, 11);

  return (
    <div className="flex flex-col gap-0 pb-20 theme-truyen bg-background overflow-x-hidden">
      
      {/* Editorial Hero */}
      {heroComic && (
        <StitchHero 
           title={heroComic.name}
           description="Một câu chuyện đầy kịch tính và chiều sâu, đưa người đọc vào thế giới của những bí ẩn chưa có lời giải và những cảm xúc mãnh liệt nhất."
           imageUrl={`${hotCdn}/uploads/comics/${heroComic.thumb_url}`}
           slug={heroComic.slug}
           category="Nổi bật"
        />
      )}

      {/* Editorial Grid */}
      {featuredComic && (
        <StitchMangaGrid 
          title="Mới Phát Hành"
          featuredComic={{
            title: featuredComic.name,
            slug: featuredComic.slug,
            imageUrl: `${domain_cdn}/uploads/comics/${featuredComic.thumb_url}`,
            lastChapter: featuredComic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${featuredComic.chaptersLatest[0].chapter_name}` : "",
            category: featuredComic.category?.[0]?.name || "Manga",
            description: "Khám phá siêu phẩm mới nhất được cập nhật trên Hồ Truyện, câu chuyện hứa hẹn sẽ đưa bạn đi từ bất ngờ này đến bất ngờ khác."
          }}
          secondaryComics={secondaryComics.map((c: any) => ({
            title: c.name,
            slug: c.slug,
            imageUrl: `${domain_cdn}/uploads/comics/${c.thumb_url}`,
            lastChapter: c.chaptersLatest?.[0]?.chapter_name ? `Ch. ${c.chaptersLatest[0].chapter_name}` : "",
            category: c.category?.[0]?.name || "Manga"
          }))}
        />
      )}

      {/* Trending Horizontal List (Bento-ish) */}
      <section className="py-24 bg-surface px-6 md:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col gap-4">
             <span className="font-label text-primary uppercase tracking-[0.4em] font-bold text-xs opacity-60">Trending Now</span>
             <h3 className="text-5xl md:text-7xl font-black font-headline text-on-surface uppercase tracking-tighter leading-[0.85]">
                Đang Thịnh Hành
             </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendComics.map((comic: any, idx: number) => (
              <StitchMangaCard 
                key={comic._id}
                title={comic.name}
                slug={comic.slug}
                imageUrl={`${domain_cdn}/uploads/comics/${comic.thumb_url}`}
                variant="vertical"
                lastChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                category={comic.category?.[0]?.name || "Manga"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AniList Integration Banner */}
      <section className="py-24 px-6 md:px-24 bg-surface-container overflow-hidden group">
          <div className="max-w-7xl mx-auto relative">
              <div className="absolute top-0 right-0 font-headline font-black text-9xl opacity-[0.02] tracking-tighter translate-x-1/2 -translate-y-1/2 select-none group-hover:scale-110 transition-transform duration-1000">ANILIST</div>
              <StitchAniListSync />
          </div>
      </section>

      {/* Bottom Visual Accent */}
      <div className="h-64 bg-background flex items-center justify-center overflow-hidden border-t border-outline-variant/10">
          <span className="font-headline font-black text-[15vw] leading-none opacity-5 tracking-tighter select-none whitespace-nowrap">HO TRUYEN NOIR EDITION 2024</span>
      </div>
    </div>
  );
}
