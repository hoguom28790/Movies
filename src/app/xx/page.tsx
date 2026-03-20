import { getTopXXMovies } from "@/services/api/topxx";
import { XXHeroSection } from "@/components/movie/XXHeroSection";
import { XXMovieRow } from "@/components/movie/XXMovieRow";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TopXX - Kho Phim Cao Cấp",
  description: "Trải nghiệm không gian phim giải trí đỉnh cao từ TopXX.",
};

export default async function XXHomePage() {
  const [latestData, javData, uncensoredData, avdbData] = await Promise.all([
    getTopXXMovies(1, "danh-sach", "phim-moi-cap-nhat"),
    getTopXXMovies(1, "the-loai", "vQMGvwTw5G"), // JAV (Nhật)
    getTopXXMovies(1, "the-loai", "vdDkXwQsHi"), // Không Che
    import("@/services/api/avdb").then(m => m.getAVDBMovies(1))
  ]);

  const heroMovie = latestData.items[0];

  return (
    <div className="container mx-auto px-4 pb-20">
      {heroMovie && <XXHeroSection movie={heroMovie} />}
      
      <div className="space-y-4">
        <XXMovieRow 
          title="PHIM MỚI CẬP NHẬT" 
          movies={latestData.items.slice(1, 13)} 
          viewAllLink="/xx/the-loai/phim-moi-cap-nhat"
        />
        
        <XXMovieRow 
          title="SIÊU PHẨM JAV (NHẬT)" 
          movies={javData.items || []} 
          viewAllLink="/xx/the-loai/vQMGvwTw5G"
        />

        <XXMovieRow 
          title="PHIM KHÔNG CHE HOT" 
          movies={uncensoredData.items || []} 
          viewAllLink="/xx/the-loai/vdDkXwQsHi"
        />

        <XXMovieRow 
          title="AVDB PREMIUM EXCLUSIVE" 
          movies={avdbData.items || []} 
          viewAllLink="/xx/nguon/avdb"
        />

        {/* Use grid for the rest or more categories */}
        <XXMovieGrid 
          initialMovies={latestData.items.slice(13) || []} 
          title="KHÁM PHÁ THÊM" 
          fetchUrl="/api/xx?slug=phim-moi-cap-nhat"
          initialPage={1}
          totalPages={latestData.pagination?.totalPages || 1}
        />
      </div>
    </div>
  );
}
