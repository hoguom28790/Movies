import { getLatestMovies } from "@/services/api";
import { getCategoryMovies } from "@/services/api/category";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieCard } from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/Button";
import { Play, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HeroSlider } from "@/components/movie/HeroSlider";


export default async function Home() {
  // Fetch all categories in parallel
  const [latestData, phimBoData, phimLeData, hoatHinhData] = await Promise.allSettled([
    getLatestMovies(1),
    getCategoryMovies("phim-bo", 1),
    getCategoryMovies("phim-le", 1),
    getCategoryMovies("hoat-hinh", 1),
  ]);

  const latest = latestData.status === "fulfilled" ? latestData.value : { items: [] };
  const phimBo = phimBoData.status === "fulfilled" ? phimBoData.value : { items: [] };
  const phimLe = phimLeData.status === "fulfilled" ? phimLeData.value : { items: [] };
  const hoatHinh = hoatHinhData.status === "fulfilled" ? hoatHinhData.value : { items: [] };

  const heroMovie = latest.items[0];

  return (
    <div className="flex flex-col gap-14 pb-20 bg-black min-h-screen">
      {/* ── Hero Section ── */}
      <HeroSlider movies={latest.items.slice(0, 5)} />

      {/* ── Phim Mới Cập Nhật (Featured Grid) ── */}
      <section className="container mx-auto px-4 lg:px-8 relative z-10 mt-[-80px] md:mt-[-120px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-1 h-7 bg-primary rounded-full inline-block" />
            Phim Mới Cập Nhật
          </h3>
          <Link
            href="/phim-moi"
            className="text-sm font-bold text-white/50 hover:text-primary transition-colors"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {latest.items.slice(1, 13).map((movie, idx) => (
            <MovieCard
              key={`${movie.id}-${idx}`}
              title={movie.title}
              slug={movie.slug}
              posterUrl={movie.thumbUrl || movie.posterUrl}
              year={movie.year}
              quality={movie.quality}
            />
          ))}
        </div>
      </section>

      {/* ── Phim Bộ Đang Chiếu ── */}
      {phimBo.items.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8">
          <MovieRow
            title="Phim Bộ Đang Chiếu"
            movies={phimBo.items.slice(0, 20)}
            viewAllHref="/phim-bo"
          />
        </section>
      )}

      {/* ── Phim Lẻ Hay Nhất ── */}
      {phimLe.items.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8">
          <MovieRow
            title="Phim Lẻ Hay Nhất"
            movies={phimLe.items.slice(0, 20)}
            viewAllHref="/phim-le"
          />
        </section>
      )}

      {/* ── Hoạt Hình Mới ── */}
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
