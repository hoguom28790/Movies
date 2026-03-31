import { getTopXXMovies } from "@/services/api/topxx";
import { HeroSection } from "@/components/movie/HeroSection";
import { MovieContinueWatching } from "@/components/movie/MovieContinueWatching";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { BentoGrid } from "@/components/movie/BentoGrid";
import { HomeSearchBar } from "@/components/movie/HomeSearchBar";
import { ActorGrid } from "@/components/movie/ActorGrid";
import { TOPXX_PATH } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TopXX - Kho Phim Cao Cấp",
  description: "Trải nghiệm không gian phim giải trí đỉnh cao từ TopXX.",
};

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
          <HeroSection movie={heroMovie} isXX />
        ) : (
          <div className="h-[70vh] w-full bg-background rounded-[40px] animate-pulse flex items-center justify-center border border-foreground/5 mx-4">
             <span className="text-foreground/10 text-xl font-black uppercase tracking-[1em]">TopXX Premium</span>
          </div>
        )}
        
        {/* Search Bar */}
        <HomeSearchBar isXX />
        
        {/* Xem Tiếp */}
        <MovieContinueWatching isXX />
        
        <div className="flex flex-col gap-20">
          <MovieRow 
            title="PHIM MỚI CẬP NHẬT" 
            movies={latestData?.items?.slice(1, 13) || []} 
            viewAllLink={`/${TOPXX_PATH}/the-loai/phim-moi-cap-nhat`}
            isXX
          />
          
          <BentoGrid 
            title="AVDB PREMIUM EXCLUSIVE" 
            movies={(avdbData?.items?.filter(Boolean) || []) as any[]} 
            viewAllLink={`/${TOPXX_PATH}/nguon/avdb`}
            isXX
          />

          <MovieRow 
            title="SIÊU PHẨM JAV (NHẬT)" 
            movies={javData?.items || []} 
            viewAllLink={`/${TOPXX_PATH}/the-loai/vQMGvwTw5G`}
            isXX
          />

          <ActorGrid isXX />

          <MovieRow 
            title="PHIM KHÔNG CHE HOT" 
            movies={uncensoredData?.items || []} 
            viewAllLink={`/${TOPXX_PATH}/the-loai/vdDkXwQsHi`}
            isXX
          />

          {/* Use grid for the rest or more categories */}
          <MovieGrid 
            initialMovies={latestData?.items?.slice(13) || []} 
            title="KHÁM PHÁ THÊM" 
            fetchUrl="/api/topxx?slug=phim-moi-cap-nhat"
            initialPage={1}
            totalPages={latestData?.pagination?.totalPages || 1}
            isXX
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[TopXX] Fatal Page Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-foreground/40 font-black uppercase tracking-[0.4em] italic leading-loose">
        Hệ thống đang bảo trì <br />
        Vui lòng quay lại sau !
      </div>
    );
  }
}
