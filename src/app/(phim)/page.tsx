import { getLatestMovies } from "@/services/api";
import { getCategoryMovies } from "@/services/api/category";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieCard } from "@/components/movie/MovieCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { HeroSlider } from "@/components/movie/HeroSlider";
import { MovieContinueWatching } from "@/components/movie/MovieContinueWatching";
import { CategoryShortcuts } from "@/components/movie/CategoryShortcuts";
import { getTrendingMovies, getTMDBImageUrl } from "@/services/tmdb";
import { BentoMovieRow } from "@/components/movie/BentoMovieRow";
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
  // Enrich first 10 for hero pool and next 20 for grid to ensure high-res coverage
  const [heroEnriched, gridEnriched] = await Promise.all([
    enrichMovies(latest.items.slice(0, 10)),
    enrichMovies(latest.items.slice(10, 30))
  ]);
 
  const heroMovies = heroEnriched.slice(0, 6);
  const displayGrid = gridEnriched;

  return (
    <div className="flex flex-col gap-10 pb-20 min-h-screen">
      {/* Hero with Cinematic Style */}
      <HeroSlider movies={heroMovies} />

      {/* Tiếp tục xem */}
      <MovieContinueWatching />

      {/* Category Shortcuts */}
      <CategoryShortcuts />

      {/* Phim Hot Nhất (Bento Style) */}
      {trending.length > 0 && (
        <BentoMovieRow 
          title="Phim Hot Nhất" 
          movies={trending.slice(0, 10).map((m: any) => ({
            id: m.id.toString(),
            title: m.title || m.name,
            originalTitle: m.original_title || m.original_name || "",
            slug: `search?q=${encodeURIComponent(m.title || m.name)}`,
            posterUrl: getTMDBImageUrl(m.poster_path) || "",
            thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
            year: m.release_date?.split("-")[0] || "2025",
            quality: "HD",
            source: 'ophim',
            tmdbRating: m.vote_average
          })) as any} 
          viewAllHref="/top-trending"
        />
      )}

      {/* Phim Mới Cập Nhật (Grid) */}
      <section className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black font-headline tracking-tight text-foreground uppercase">
              Phim Mới Cập Nhật
            </h3>
            <div className="h-1 w-12 bg-primary mt-1 rounded-full"></div>
          </div>
          <Link href="/phim-moi" className="text-primary text-[12px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform">
            Tất cả <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
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

      {/* Phim Bộ */}
      {phimBo.items.length > 0 && (
        <MovieRow title="Phim Bộ Đặc Sắc" movies={await enrichMovies(phimBo.items.slice(0, 20))} viewAllHref="/phim-bo" />
      )}

      {/* Phim Lẻ */}
      {phimLe.items.length > 0 && (
        <MovieRow title="Phim Lẻ Tuyển Chọn" movies={await enrichMovies(phimLe.items.slice(0, 20))} viewAllHref="/phim-le" />
      )}
    </div>
  );
}
