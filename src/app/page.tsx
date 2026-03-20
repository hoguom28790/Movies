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
  // Fetch all categories in parallel
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

  return (
    <div className="flex flex-col gap-12 pb-20 bg-black min-h-screen">
      {/* ── Hero Section ── */}
      <HeroSlider movies={latest.items.slice(0, 5)} />

      {/* ── Category Shortcuts ── */}
      <CategoryShortcuts />

      {/* ── Phim Mới Cập Nhật (Featured Grid) ── */}
      <section className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-1 h-7 bg-primary rounded-full inline-block" />
            Phim Mới Cập Nhật
          </h3>
          <Link href="/phim-moi" className="text-sm font-bold text-white/40 hover:text-primary transition-colors flex items-center gap-1 group">
             Xem tất cả <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {latest.items.slice(0, 12).map((movie: any) => (
            <MovieCard 
              key={movie.slug} 
              title={movie.name} 
              slug={movie.slug} 
              posterUrl={movie.poster_url} 
              year={movie.year}
              quality={movie.quality}
            />
          ))}
        </div>
      </section>

      {/* ── Trending TMDB ── */}
      {trending.length > 0 && (
         <section className="container mx-auto px-4 lg:px-8">
            <MovieRow 
              title="Thịnh Hành TMDB" 
              movies={trending.slice(0, 20).map((m: any) => ({
                name: m.title || m.name,
                slug: `search?q=${encodeURIComponent(m.title || m.name)}`,
                poster_url: getTMDBImageUrl(m.poster_path) || "",
                year: m.release_date?.split("-")[0] || "2024",
                quality: "4K UHD"
              }))} 
              viewAllHref="/top-trending"
            />
         </section>
      )}

      {/* ── Phim Bộ ── */}
      {phimBo.items.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8">
          <MovieRow
            title="Phim Bộ Đang Chiếu"
            movies={phimBo.items.slice(0, 20)}
            viewAllHref="/phim-bo"
          />
        </section>
      )}

      {/* ── Phim Lẻ ── */}
      {phimLe.items.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8">
          <MovieRow
            title="Phim Lẻ Hay Nhất"
            movies={phimLe.items.slice(0, 20)}
            viewAllHref="/phim-le"
          />
        </section>
      )}

      {/* ── Hoạt Hình ── */}
      {hoatHinh.items.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8">
          <MovieRow
            title="Hoạt Hình Mới"
            movies={hoatHinh.items.slice(0, 20)}
            viewAllHref="/the-loai/hoat-hinh"
          />
        </section>
      )}
    </div>
  );
}
