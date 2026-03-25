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
import { searchMovies as searchLocal } from "@/services/api";

const MANUAL_MAPPING: Record<string, string> = {
  "Cách giết để giàu": "gia-tai-cua-ngoai",
  "Trò Chơi Của Quỷ 2": "tro-choi-giet-nguoi-2",
  "Cứu": "cuu-2026"
};

async function resolveTrendingMovies(trending: any[]) {
  return await Promise.all(trending.map(async (m) => {
    const title = m.title || m.name;
    const year = m.release_date?.split("-")[0];
    
    // Check manual mapping first
    if (MANUAL_MAPPING[title]) {
      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: MANUAL_MAPPING[title],
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: 'ophim' as any,
        tmdbRating: m.vote_average
      };
    }

    try {
      // Parallel search on local providers
      let res = await searchLocal(title);
      
      // Fallback to original title if no results for translated title
      if (res.items.length === 0 && m.original_title && m.original_title !== title) {
        res = await searchLocal(m.original_title);
      }
      
      const normalize = (s: string) => s.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s]/g, "") // Remove all non-alphanumeric
        .replace(/\s+/g, " ").trim();

      const normalizedTarget = normalize(title);
      const normalizedOriginal = normalize(m.original_title || "");

      // Try to find a precise match
      let match = res.items.find((item: any) => {
        const itemTitle = normalize(item.title);
        const itemOrigin = normalize(item.originalTitle || "");
        const itemSlug = item.slug.toLowerCase();
        const yearStr = year || "";
        
        // Match Strategy 1: Exact matches (normalized)
        const isExactMatch = itemTitle === normalizedTarget || itemOrigin === normalizedTarget || 
                           itemTitle === normalizedOriginal || itemOrigin === normalizedOriginal;
        
        // Match Strategy 2: Partial matches (important for subtitles)
        const isPartialMatch = itemTitle.startsWith(normalizedTarget) || normalizedTarget.startsWith(itemTitle);
        
        // Match Strategy 3: Slug matches
        const cleanSlug = itemSlug.replace(/-/g, " ");
        const isSlugMatch = itemSlug === title.toLowerCase().replace(/\s+/g, '-') || 
                           cleanSlug.includes(normalizedTarget);
        
        // Year check with +/- 1 year tolerance
        const itemYear = parseInt(item.year);
        const targetYear = parseInt(yearStr);
        const isYearMatch = yearStr ? (itemYear === targetYear || itemYear === targetYear + 1 || itemYear === targetYear - 1) : true;
        
        return (isExactMatch && isYearMatch) || (isSlugMatch && isYearMatch) || (isPartialMatch && isYearMatch);
      });

      // Special Heuristic: Try to fetch known slugs if no match found
      if (!match) {
        const candidateSlug = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-')}-${year || '2025'}`;
        const candidateSlugNoYear = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, '-')}`;
        
        for (const mirror of ["https://ophim1.com", "https://ophim18.cc"]) {
          for (const s of [candidateSlug, candidateSlugNoYear]) {
            try {
              const check = await fetch(`${mirror}/v1/api/phim/${s}`, { signal: AbortSignal.timeout(2000) });
              if (check.ok) {
                const json = await check.json();
                if (json.status === "success" || json.data?.item) {
                   match = { slug: s, source: 'ophim' } as any;
                   break;
                }
              }
            } catch (e) {}
          }
          if (match) break;
        }
      }

      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: match ? match.slug : `/search?q=${encodeURIComponent(title)}`,
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: match?.source || 'ophim' as any,
        tmdbRating: m.vote_average
      };
    } catch (e) {
      return {
        id: m.id.toString(),
        title: title,
        originalTitle: m.original_title || m.original_name || "",
        slug: `/search?q=${encodeURIComponent(title)}`,
        posterUrl: getTMDBImageUrl(m.poster_path) || "",
        thumbUrl: getTMDBImageUrl(m.backdrop_path) || "",
        year: year || "2025",
        quality: "HD",
        source: 'ophim' as any,
        tmdbRating: m.vote_average
      };
    }
  }));
}

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
          movies={await resolveTrendingMovies(trending.slice(0, 10))} 
          viewAllHref="/phim-moi"
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
