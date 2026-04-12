export const revalidate = 3600; // Revalidate home page every hour

import { getLatestMovies } from "@/services/api";
import { getCategoryMovies } from "@/services/api/category";
import Link from "next/link";
import { HeroSlider } from "@/components/movie/HeroSlider";
import { MovieContinueWatching } from "@/components/movie/MovieContinueWatching";
import { CategoryShortcuts } from "@/components/movie/CategoryShortcuts";
import { SpotlightMovieSection } from "@/components/movie/SpotlightMovieSection";
import { Top10MovieRow } from "@/components/movie/Top10MovieRow";

export default async function Home() {
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

  const { enrichMovies } = await import("@/services/movieEnricher");

  const isTrailer = (m: any) => {
    const s = (m.status || m.episode_current || m.episodeCurrent || "").toLowerCase();
    const q = (m.quality || "").toLowerCase();
    const t = (m.title || "").toLowerCase();
    const sl = (m.slug || "").toLowerCase();
    const o = (m.overview || "").toLowerCase();

    return (
      s.includes("trailer") ||
      q.includes("trailer") ||
      t.includes("trailer") ||
      sl.includes("trailer") ||
      o.includes("xem trailer") ||
      s.startsWith("0/") ||
      s === "0" ||
      s.includes("tập 0") ||
      s.includes("coming soon") ||
      s.includes("sắp chiếu") ||
      s.includes("chưa phát sóng")
    );
  };

  const validLatestItems = latest.items.filter((m) => !isTrailer(m));

  // Hero uses items 0-5, spotlight uses items 6-25 (skip first 6, show 20)
  const [heroEnriched, spotlightEnriched, phimLeEnriched, phimBoEnriched] = await Promise.all([
    enrichMovies(validLatestItems.slice(0, 6)),
    enrichMovies(validLatestItems.slice(6, 26)),
    enrichMovies(phimLe.items.slice(0, 10)),
    enrichMovies(phimBo.items.slice(0, 10)),
  ]);

  const heroMovies = heroEnriched;

  return (
    <div className="flex flex-col gap-12 pb-20 min-h-screen">
      <HeroSlider movies={heroMovies} />

      <MovieContinueWatching />

      <CategoryShortcuts
        posters={{
          "phim-moi": heroMovies[0]?.posterUrl,
          "chieu-rap": phimLe.items.find((m) => m.category?.some((c: any) => c.slug === "chieu-rap"))?.posterUrl || phimLe.items[0]?.posterUrl,
          "long-tieng": phimBo.items.find((m) => m.category?.some((c: any) => c.slug === "long-tieng"))?.posterUrl || phimBo.items[0]?.posterUrl,
          "thuyet-minh": phimBo.items.find((m) => m.category?.some((c: any) => c.slug === "thuyet-minh"))?.posterUrl || phimBo.items[1]?.posterUrl,
          "co-trang": phimBo.items.find((m) => m.category?.some((c: any) => c.slug === "co-trang"))?.posterUrl || heroMovies[4]?.posterUrl,
          "kinh-di": phimLe.items.find((m) => m.category?.some((c: any) => c.slug === "kinh-di"))?.posterUrl || heroMovies[2]?.posterUrl,
          "hinh-su": phimLe.items.find((m) => m.category?.some((c: any) => c.slug === "hinh-su"))?.posterUrl || phimBoEnriched[0]?.posterUrl,
          "au-my": phimLe.items.find((m) => m.country?.some((c: any) => c.slug === "au-my"))?.posterUrl || phimLeEnriched[3]?.posterUrl,
          "hoat-hinh": hoatHinh.items[0]?.posterUrl,
        }}
      />

      {/* Phim mới cập nhật — Spotlight layout */}
      {spotlightEnriched.length > 0 && (
        <SpotlightMovieSection
          movies={spotlightEnriched}
          title="Phim mới cập nhật"
          viewAllHref="/phim-moi"
        />
      )}

      {/* Phim lẻ tuyển chọn — Top 10 ranking */}
      {phimLeEnriched.length > 0 && (
        <Top10MovieRow
          title="Phim lẻ tuyển chọn"
          movies={phimLeEnriched}
          viewAllHref="/phim-le"
        />
      )}

      {/* Phim bộ đặc sắc — Top 10 ranking */}
      {phimBoEnriched.length > 0 && (
        <Top10MovieRow
          title="Phim bộ đặc sắc"
          movies={phimBoEnriched}
          viewAllHref="/phim-bo"
        />
      )}
    </div>
  );
}
