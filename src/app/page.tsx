import { getLatestMovies } from "@/services/api";
import { getCategoryMovies } from "@/services/api/category";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieCard } from "@/components/movie/MovieCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { HeroSlider } from "@/components/movie/HeroSlider";
import { CategoryShortcuts } from "@/components/movie/CategoryShortcuts";
import { getTrendingMovies, getTMDBImageUrl } from "@/services/tmdb";

export default async function Home() {
  const [latestData, phimBoData, phimLeData, hoatHinhData, trendingData] = await Promise.allSettled([
    getLatestMovies(1),
    getCategoryMovies("phim-bo", 1),
    getCategoryMovies("phim-le", 1),
    getCategoryMovies("hoat-hinh", 1),
    getTrendingMovies(1),
  ]);

  const latest = latestData.status === "fulfilled" ? latestData.value : { items: [] };
  const phimBo = phimBoData.status === "fulfilled" ? phimBoData.value : { items: [] };
  const phimLe = phimLeData.status === "fulfilled" ? phimLeData.value : { items: [] };
  const hoatHinh = hoatHinhData.status === "fulfilled" ? hoatHinhData.value : { items: [] };
  const trending = trendingData.status === "fulfilled" ? trendingData.value?.results || [] : [];

  const { enrichMovies } = await import("@/services/movieEnricher");
  // Enrich first 10 for hero pool and next 20 for grid to ensure high-res coverage
  const [heroEnriched, gridEnriched] = await Promise.all([
    enrichMovies(latest.items.slice(0, 10)),
    enrichMovies(latest.items.slice(10, 30))
  ]);
 
  const heroMovies = heroEnriched.slice(0, 6);
  const displayGrid = gridEnriched;

  return (
    <div className="flex flex-col gap-10 pb-20 min-h-screen">
      {/* Hero */}
      <HeroSlider movies={heroMovies} />

      {/* Category Shortcuts */}
      <CategoryShortcuts />

      {/* Phim Mới Cập Nhật (Grid) */}
      <section className="container mx-auto px-4 lg:px-12 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white/90">
            Phim Mới Cập Nhật
          </h3>
          <Link href="/phim-moi" className="text-[12px] text-white/40 hover:text-white transition-colors flex items-center gap-1 group">
            Xem toàn bộ <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayGrid.map((movie) => (
            <MovieCard 
              key={movie.slug} 
              title={movie.title} 
              slug={movie.slug} 
              posterUrl={movie.posterUrl} 
              year={movie.year}
              quality={movie.quality}
              originalTitle={movie.originalTitle}
            />
          ))}
        </div>
      </section>

      {/* Trending TMDB */}
      {trending.length > 0 && (
        <section className="container mx-auto px-0">
          <MovieRow 
            title="Phim Hot Rần Rần" 
            movies={trending.slice(0, 20).map((m: any) => ({
              id: m.id.toString(),
              title: m.title || m.name,
              originalTitle: m.original_title || m.original_name || "",
              slug: `search?q=${encodeURIComponent(m.title || m.name)}`,
              posterUrl: getTMDBImageUrl(m.poster_path) || "",
              thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
              year: m.release_date?.split("-")[0] || "2024",
              quality: "HD",
              source: 'ophim'
            }))} 
            viewAllHref="/top-trending"
          />
        </section>
      )}

      {/* Phim Bộ */}
      {phimBo.items.length > 0 && (
        <section className="container mx-auto px-0">
          <MovieRow title="Phim Bộ Đang Chiếu" movies={phimBo.items.slice(0, 20)} viewAllHref="/phim-bo" />
        </section>
      )}

      {/* Phim Lẻ */}
      {phimLe.items.length > 0 && (
        <section className="container mx-auto px-0">
          <MovieRow title="Phim Lẻ Hay Nhất" movies={phimLe.items.slice(0, 20)} viewAllHref="/phim-le" />
        </section>
      )}

      {/* Hoạt Hình */}
      {hoatHinh.items.length > 0 && (
        <section className="container mx-auto px-0">
          <MovieRow title="Hoạt Hình Mới" movies={hoatHinh.items.slice(0, 20)} viewAllHref="/the-loai/hoat-hinh" />
        </section>
      )}
    </div>
  );
}
