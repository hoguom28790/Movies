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
import { XXActorGrid } from "@/components/movie/XXActorGrid";

export default async function XXHomePage() {
  // FINAL FIX TopXX Server Component error: Robut try-catch for all data fetching
  try {
    const [latestData, javData, uncensoredData, avdbData] = await Promise.all([
      getTopXXMovies("phim-moi", "", 1).catch(err => {
        console.error("[TopXX] Fetch latest error:", err);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      }),
      getTopXXMovies("the-loai", "vQMGvwTw5G", 1).catch(err => {
        console.error("[TopXX] Fetch JAV error:", err);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      }),
      getTopXXMovies("the-loai", "vdDkXwQsHi", 1).catch(err => {
        console.error("[TopXX] Fetch uncensored error:", err);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      }),
      import("@/services/api/avdb").then(m => m.getAVDBMovies(1)).catch(err => {
        console.error("[TopXX] Fetch AVDB error:", err);
        return { items: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1 } };
      })
    ]);

    const heroMovie = latestData?.items?.[0];

    return (
      <div className="flex flex-col gap-16 pb-20 mt-[-20px] max-w-7xl mx-auto">
        {heroMovie ? (
          <XXHeroSection movie={heroMovie} />
        ) : (
          <div className="h-[70vh] w-full bg-surface rounded-[40px] animate-pulse flex items-center justify-center border border-white/5 mx-4">
             <span className="text-white/10 text-xl font-black uppercase tracking-[1em]">TopXX Premium</span>
          </div>
        )}
        
        {/* Search Bar */}
        <XXSearchBar />
        
        {/* Xem Tiếp */}
        <XXContinueWatching />
        
        <div className="flex flex-col gap-20">
          <XXMovieRow 
            title="PHIM MỚI CẬP NHẬT" 
            movies={latestData?.items?.slice(1, 13) || []} 
            viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/phim-moi-cap-nhat"
          />
          
          <XXBentoGrid 
            title="AVDB PREMIUM EXCLUSIVE" 
            movies={avdbData?.items || []} 
            viewAllLink="/v2k9r5w8m3x7n1p4q0z6/nguon/avdb"
          />

          <XXMovieRow 
            title="SIÊU PHẨM JAV (NHẬT)" 
            movies={javData?.items || []} 
            viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/vQMGvwTw5G"
          />

          <XXActorGrid />

          <XXMovieRow 
            title="PHIM KHÔNG CHE HOT" 
            movies={uncensoredData?.items || []} 
            viewAllLink="/v2k9r5w8m3x7n1p4q0z6/the-loai/vdDkXwQsHi"
          />

          {/* Use grid for the rest or more categories */}
          <XXMovieGrid 
            initialMovies={latestData?.items?.slice(13) || []} 
            title="KHÁM PHÁ THÊM" 
            fetchUrl="/api/topxx?slug=phim-moi-cap-nhat"
            initialPage={1}
            totalPages={latestData?.pagination?.totalPages || 1}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[TopXX] Fatal Page Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-white/40 font-black uppercase tracking-[0.4em] italic leading-loose">
        Hệ thống đang bảo trì <br />
        Vui lòng quay lại sau !
      </div>
    );
  }
}
