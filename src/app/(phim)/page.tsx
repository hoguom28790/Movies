export const revalidate = 1800; // Revalidate home page every 30 minutes

import { getLatestMovies } from "@/services/api";
import { getCategoryMovies } from "@/services/api/category";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieCard } from "@/components/movie/MovieCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { HeroSlider } from "@/components/movie/HeroSlider";
import { MovieContinueWatching } from "@/components/movie/MovieContinueWatching";
import { CategoryShortcuts } from "@/components/movie/CategoryShortcuts";
import { getTrendingMovies } from "@/services/tmdb";
import { BentoMovieRow } from "@/components/movie/BentoMovieRow";
import { unstable_cache } from "next/cache";

const MANUAL_MAPPING: Record<string, string> = {
  "Cách giết để giàu": "gia-tai-cua-ngoai",
  "Trò Chơi Của Quỷ 2": "tro-choi-giet-nguoi-2",
  "Cứu": "cuu",
  "Sàn Đấu Sinh Tử": "san-dau-sinh-tu"
};

async function resolveTrendingMoviesInternal(trending: any[]) {
  const { searchMovies: searchLocal } = await import("@/services/api");
  const { getTMDBImageUrl } = await import("@/services/tmdb");

  return await Promise.all(trending.map(async (m) => {
    const title = m.title || m.name;
    const year = m.release_date?.split("-")[0];
    
    if (MANUAL_MAPPING[title]) {
      const slug = MANUAL_MAPPING[title];
      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: slug,
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: 'ophim' as any,
        tmdbRating: m.vote_average
      };
    }

    try {
      const resolutionPromise = (async () => {
        let res = await searchLocal(title);
        
        if (res.items.length === 0 && m.original_title && m.original_title !== title) {
          res = await searchLocal(m.original_title);
        }
        
        const normalize = (s: string) => s.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[đĐ]/g, "d")
          .replace(/[^a-z0-9\s]/g, "") 
          .replace(/\s+/g, " ").trim();

        const normalizedTarget = normalize(title);
        const normalizedOriginal = normalize(m.original_title || "");

        let match = res.items.find((item: any) => {
          const itemTitle = normalize(item.title);
          const itemOrigin = normalize(item.originalTitle || "");
          const itemYear = parseInt(item.year);
          const targetYear = parseInt(year || "");
          
          const isExactMatch = itemTitle === normalizedTarget || itemOrigin === normalizedTarget || 
                             itemTitle === normalizedOriginal || itemOrigin === normalizedOriginal;
          
          const isYearMatch = year ? (itemYear === targetYear || itemYear === targetYear + 1 || itemYear === targetYear - 1) : true;
          return isExactMatch && isYearMatch;
        });

        if (!match) {
           const candidateSlug = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-')}-${year || '2025'}`;
           match = { slug: candidateSlug } as any; // default fallback slug
        }

        return match ? match.slug : `/search?q=${encodeURIComponent(title)}`;
      })();

      const finalSlug = await Promise.race([
         resolutionPromise,
         new Promise<string>((resolve) => setTimeout(() => resolve(`/search?q=${encodeURIComponent(title)}`), 2000))
      ]);

      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: finalSlug,
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: 'ophim' as any,
        tmdbRating: m.vote_average
      };
    } catch (e) {
      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: `/search?q=${encodeURIComponent(title)}`,
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: 'ophim' as any,
        tmdbRating: m.vote_average
      };
    }
  }));
}

const resolveTrendingMovies = unstable_cache(
  async (trending: any[]) => resolveTrendingMoviesInternal(trending),
  ["trending-movies-slugs"],
  { revalidate: 3600 }
);

export default async function Home() {
  const [latestData, phimBoData, phimLeData, hoatHinhData, trendingData] = await Promise.allSettled([
    getLatestMovies(1),
    getCategoryMovies("phim-bo", 1),
    getCategoryMovies("phim-le", 1),
    getCategoryMovies("hoat-hinh", 1),
    getTrendingMovies(1)
  ]);

  const latest = latestData.status === "fulfilled" ? latestData.value : { items: [] };
  const phimBo = phimBoData.status === "fulfilled" ? phimBoData.value : { items: [] };
  const phimLe = phimLeData.status === "fulfilled" ? phimLeData.value : { items: [] };
  const hoatHinh = hoatHinhData.status === "fulfilled" ? hoatHinhData.value : { items: [] };
  const trending = trendingData.status === "fulfilled" ? trendingData.value?.results || [] : [];

  const { enrichMovies } = await import("@/services/movieEnricher");
  const [heroEnriched, gridEnriched] = await Promise.all([
    enrichMovies(latest.items.slice(0, 10)),
    enrichMovies(latest.items.slice(10, 30))
  ]);
 
  const heroMovies = heroEnriched.slice(0, 6);
  const displayGrid = gridEnriched;

  return (
    <div className="flex flex-col gap-12 pb-20 min-h-screen">
      <HeroSlider movies={heroMovies} />

      <MovieContinueWatching />

      <CategoryShortcuts />

      {trending.length > 0 && (
        <BentoMovieRow 
          title="Phát hành gần đây" 
          movies={await resolveTrendingMovies(trending.slice(0, 10))} 
          viewAllHref="/phim-moi"
        />
      )}

      <section className="container mx-auto px-6 lg:px-12 relative z-10 transition-all">
        <div className="flex items-center justify-between mb-8 group">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Phim mới cập nhật
          </h2>
          <Link href="/phim-moi" className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-1.5 transition-all">
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
          {displayGrid.map((movie) => (
            <MovieCard 
              key={movie.slug} 
              title={movie.title} 
              slug={movie.slug} 
              posterUrl={movie.posterUrl} 
              year={movie.year}
              quality={movie.quality}
              originalTitle={movie.originalTitle}
              score={movie.imdbRating || movie.tmdbRating}
            />
          ))}
        </div>
      </section>

      {phimBo.items.length > 0 && (
        <MovieRow title="Phim bộ đặc sắc" movies={await enrichMovies(phimBo.items.slice(0, 20))} viewAllHref="/phim-bo" />
      )}

      {phimLe.items.length > 0 && (
        <MovieRow title="Phim lẻ tuyển chọn" movies={await enrichMovies(phimLe.items.slice(0, 20))} viewAllHref="/phim-le" />
      )}
    </div>
  );
}
