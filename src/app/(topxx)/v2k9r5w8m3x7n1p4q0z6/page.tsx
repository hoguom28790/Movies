import { getTopXXMovies } from "@/services/api/topxx";
import { XXHeroSection } from "@/components/movie/XXHeroSection";
import { XXContinueWatching } from "@/components/movie/XXContinueWatching";
import { XXMovieRow } from "@/components/movie/XXMovieRow";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TopXX - Kho Phim Cao Cấp",
  description: "Trải nghiệm không gian phim giải trí đỉnh cao từ TopXX.",
};

import { XXBentoGrid } from "@/components/movie/XXBentoGrid";
import { XXSearchBar } from "@/components/movie/XXSearchBar";

export default async function XXHomePage() {
  const [latestData, javData, uncensoredData, avdbData] = await Promise.all([
    getTopXXMovies(1, "danh-sach", "phim-moi-cap-nhat"),
    getTopXXMovies(1, "the-loai", "vQMGvwTw5G"), // JAV (Nhật)
    getTopXXMovies(1, "the-loai", "vdDkXwQsHi"), // Không Che
    import("@/services/api/avdb").then(m => m.getAVDBMovies(1))
  ]);

  const heroMovie = latestData.items[0];

  return (
    <div className="flex flex-col gap-16 pb-20 mt-[-20px] max-w-7xl mx-auto">
      {heroMovie && <XXHeroSection movie={heroMovie} />}
      
      {/* Search Bar */}
      <XXSearchBar />
      
      {/* Xem Tiếp */}
      <XXContinueWatching />
      
      <div className="flex flex-col gap-20">
        <XXMovieRow 
          title="PHIM MỚI CẬP NHẬT" 
          movies={latestData.items.slice(1, 13)} 
          viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/phim-moi-cap-nhat"
        />
        
        <XXBentoGrid 
          title="AVDB PREMIUM EXCLUSIVE" 
          movies={avdbData.items || []} 
          viewAllLink="/v2k9r5w8m3x7n1p4q0z6/nguon/avdb"
        />

        <XXMovieRow 
          title="SIÊU PHẨM JAV (NHẬT)" 
          movies={javData.items || []} 
          viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/vQMGvwTw5G"
        />

        <XXMovieRow 
          title="PHIM KHÔNG CHE HOT" 
          movies={uncensoredData.items || []} 
          viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/vdDkXwQsHi"
        />

        {/* Use grid for the rest or more categories */}
        <XXMovieGrid 
          initialMovies={latestData.items.slice(13) || []} 
          title="KHÁM PHÁ THÊM" 
          fetchUrl="/api/topxx?slug=phim-moi-cap-nhat"
          initialPage={1}
          totalPages={latestData.pagination?.totalPages || 1}
        />
      </div>
    </div>
  );
}
