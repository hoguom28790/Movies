import { getTopXXMovies } from "@/services/api/topxx";
import { getAVDBMovies } from "@/services/api/avdb";
import { HeroSlider } from "@/components/movie/HeroSlider";
import { MovieContinueWatching } from "@/components/movie/MovieContinueWatching";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { BentoGrid } from "@/components/movie/BentoGrid";
import { HomeSearchBar } from "@/components/movie/HomeSearchBar";
import { FavoriteActorsRow } from "@/components/movie/FavoriteActorsRow";
import { TOPXX_PATH } from "@/lib/constants";

import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TopXX - Kho Phim Cao Cấp",
  description: "Trải nghiệm không gian phim giải trí đỉnh cao từ TopXX.",
};

function interleave<T>(arr1: T[], arr2: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < max; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
}

function RowSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 bg-foreground/10 animate-pulse rounded-md" />
        <div className="h-4 w-16 bg-foreground/5 animate-pulse rounded-sm" />
      </div>
      <div className="flex gap-4 overflow-x-hidden relative">
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="min-w-[140px] md:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px] aspect-[7/10] bg-foreground/5 animate-pulse rounded-[16px] border border-foreground/5" />
        ))}
      </div>
    </div>
  );
}

async function JAVSection() {
  const data = await getTopXXMovies("the-loai", "vQMGvwTw5G", 1).catch(() => null);
  if (!data?.items?.length) return null;
  return (
    <MovieRow
      title="SIÊU PHẨM JAV (NHẬT)"
      movies={data.items}
      viewAllLink={`/${TOPXX_PATH}/the-loai/vQMGvwTw5G`}
      isXX
    />
  );
}

async function UncensoredSection() {
  const data = await getTopXXMovies("the-loai", "vdDkXwQsHi", 1).catch(() => null);
  if (!data?.items?.length) return null;
  return (
    <MovieRow
      title="PHIM KHÔNG CHE HOT"
      movies={data.items}
      viewAllLink={`/${TOPXX_PATH}/the-loai/vdDkXwQsHi`}
      isXX
    />
  );
}

export default async function XXHomePage() {
  try {
    const [latestData, avdbData] = await Promise.all([
      getTopXXMovies("phim-moi", "", 1).catch(() => ({
        items: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1 },
      })),
      getAVDBMovies(1).catch(() => ({
        items: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1 },
      })),
    ]);

    // Merge TopXX + AVDB phim mới → interleave for variety
    const topxxLatest = latestData?.items || [];
    const avdbLatest = (avdbData?.items?.filter(Boolean) || []) as any[];

    // Hero needs thumbUrl/overview; enrich topxx items with posterUrl as fallback
    const heroCandidates = interleave(
      topxxLatest.slice(0, 8).map((m) => ({
        ...m,
        thumbUrl: m.thumbUrl || m.posterUrl,
        overview: "",
      })),
      avdbLatest.slice(0, 4).map((m) => ({
        ...m,
        thumbUrl: m.thumbUrl || m.posterUrl,
        overview: "",
        // AVDB watch URL needs av- prefix
        slug: m.slug, // already "av-xxx"
      }))
    ).slice(0, 8);

    // "Phim mới cập nhật" row = merge of remaining topxx + avdb (not used in hero)
    const latestRow = interleave(
      topxxLatest.slice(8, 16),
      avdbLatest.slice(4, 12)
    );

    return (
      <div className="flex flex-col pb-20 mt-[-20px] max-w-7xl mx-auto">
        {/* ─── HERO SLIDER ─────────────────────────────────────────── */}
        {heroCandidates.length > 0 ? (
          <HeroSlider
            movies={heroCandidates as any}
            isXX
          />
        ) : (
          <div className="h-[70vh] w-full bg-background rounded-[40px] animate-pulse flex items-center justify-center border border-foreground/5 mx-4">
            <span className="text-foreground/10 text-xl font-black uppercase tracking-[1em]">TopXX Premium</span>
          </div>
        )}

        <div className="flex flex-col gap-20 px-4 md:px-8 mt-16">
          {/* Xem Tiếp */}
          <MovieContinueWatching isXX />

          {/* Diễn viên yêu thích */}
          <FavoriteActorsRow isXX />

          {/* Phim mới cập nhật từ TopXX.vip */}
          <MovieRow
            title="PHIM MỚI CẬP NHẬT TỪ TOPXX.VIP"
            movies={topxxLatest.slice(0, 12) as any[]}
            viewAllLink={`/${TOPXX_PATH}/the-loai/phim-moi-cap-nhat`}
            isXX
          />

          {/* Phim mới cập nhật từ AVDBAPI.com */}
          {avdbLatest.length > 0 && (
            <MovieRow
              title="PHIM MỚI CẬP NHẬT TỪ AVDBAPI.COM"
              movies={avdbLatest.slice(0, 12) as any[]}
              viewAllLink={`/${TOPXX_PATH}/nguon/avdb`}
              isXX
            />
          )}

          {/* JAV section (Streaming via Suspense) */}
          <Suspense fallback={<RowSkeleton />}>
            <JAVSection />
          </Suspense>

          {/* Không che section (Streaming via Suspense) */}
          <Suspense fallback={<RowSkeleton />}>
            <UncensoredSection />
          </Suspense>

          {/* Khám phá thêm */}
          <MovieGrid
            initialMovies={interleave(topxxLatest.slice(12), avdbLatest.slice(12)) as any[]}
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
