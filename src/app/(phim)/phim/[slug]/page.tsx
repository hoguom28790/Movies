// src/app/(phim)/phim/[slug]/page.tsx
// FIXED: Fixed server component crash + Added strict source routing (Hồ Phim vs TopXX)
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { MoviePlaySection } from "@/components/movie/MoviePlaySection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";

const normalizeTitle = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
};

async function fetchMovieData(slug: string) {
  const isTopXX = slug.startsWith("av-") || /^[A-Z]{2,5}-\d{2,6}$/i.test(slug);
  
  try {
    const fetchWithSources = async (s: string) => {
      // 1. TopXX Sources
      if (isTopXX) {
         const { getAVDBDetails } = await import("@/services/api/avdb");
         const { getTopXXDetails } = await import("@/services/api/topxx");
         
         const id = s.startsWith("av-") ? s.split("av-")[1] : s;
         const [av, tx] = await Promise.allSettled([
            getAVDBDetails(id),
            getTopXXDetails(s)
         ]);

         if (tx.status === "fulfilled" && tx.value) return { source: "topxx", data: tx.value, episodes: tx.value.episodes || [] };
         if (av.status === "fulfilled" && av.value) return { source: "avdb", data: av.value, episodes: av.value.servers?.[0]?.episodes || [] };
      }

      // 2. Hồ Phim Sources
      const [ng, kk, op] = await Promise.allSettled([
        fetch(`https://phim.nguonc.com/api/film/${s}`).then(r => r.json()).catch(() => null),
        fetch(`https://phimapi.com/v1/api/phim/${s}`).then(r => r.json()).catch(() => null),
        fetch(`https://ophim1.com/v1/api/phim/${s}`).then(r => r.json()).catch(() => null),
      ]);

      if (kk.status === "fulfilled" && kk.value?.data?.item) return { source: "kkphim", data: kk.value.data.item, episodes: kk.value.data.episodes || [] };
      if (op.status === "fulfilled" && op.value?.data?.item) return { source: "ophim", data: op.value.data.item, episodes: op.value.data.episodes || [] };
      if (ng.status === "fulfilled" && ng.value?.movie) return { source: "nguonc", data: ng.value.movie, episodes: ng.value.episodes || [] };
      
      return null;
    };

    let movie = await fetchWithSources(slug);
    if (movie) return movie;

    // Search Fallback
    const { searchMovies } = await import("@/services/api");
    const searchRes = await searchMovies(slug.replace(/-/g, " "));
    if (searchRes.items.length > 0) {
       return await fetchWithSources(searchRes.items[0].slug);
    }
  } catch (err) {
    console.error("fetchMovieData Error:", err);
  }
  return null;
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const movieRes = await fetchMovieData(slug);
    if (!movieRes) return notFound();
    const { data, episodes, source } = movieRes;

    const safeData = {
      name: data.name || data.title || "Đang cập nhật",
      origin_name: data.origin_name || data.original_name || data.movie_code || "",
      year: data.year || "",
      quality: data.quality || "HD",
      description: data.content || data.description || "",
      poster_url: data.posterUrl || data.poster_url || "",
      thumb_url: data.thumbUrl || data.thumb_url || "",
      actor: Array.isArray(data.actor) ? data.actor : [],
      category: Array.isArray(data.category) ? data.category : []
    };

    let tmdbData: any = null;
    const searchRes = await searchTMDBMovie(safeData.name, parseInt(safeData.year)).catch(() => null);
    if (searchRes) tmdbData = await getTMDBMovieDetails(searchRes.id, searchRes.media_type).catch(() => null);

    const poster = tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path, 'w780') : (safeData.poster_url.startsWith("http") ? safeData.poster_url : `https://img.ophim.live/uploads/movies/${safeData.poster_url}`);
    
    return (
      <div className="min-h-screen bg-[#0a0c10] text-white pb-20">
        <div className="relative h-[60vh] w-full overflow-hidden">
           <img src={poster} className="w-full h-full object-cover opacity-20 blur-xl" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-64 relative z-10">
           <div className="flex flex-col lg:flex-row gap-12">
              <div className="w-full lg:w-80 space-y-8">
                 <img src={poster} className="w-full rounded-[40px] shadow-2xl ring-1 ring-white/10" />
                 <MoviePlaySection slug={slug} source={source} firstEp={episodes?.[0]?.items?.[0] || episodes?.[0]} movieTitle={safeData.name} year={safeData.year} />
                 <WatchlistBtn movieSlug={slug} movieTitle={safeData.name} posterUrl={poster} />
              </div>

              <div className="flex-1 space-y-8">
                 <div className="space-y-4">
                    <h1 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter">{safeData.name}</h1>
                    <p className="text-xl text-white/40 font-black italic">{safeData.origin_name}</p>
                 </div>
                 <p className="text-lg text-white/60 leading-relaxed max-w-3xl">{tmdbData?.overview || safeData.description}</p>
                 <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                 <MovieTabs slug={slug} source={source} servers={[]} />
              </div>
           </div>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10] p-10 text-center">
        <Play className="w-20 h-20 text-red-600 mb-10 rotate-90" />
        <h1 className="text-3xl font-black uppercase italic mb-4">Hồ Phim - Bảo trì hệ thống</h1>
        <p className="text-white/40 mb-10">{err.message}</p>
        <Link href="/"><Button size="lg" className="rounded-2xl px-12 bg-blue-600 font-black italic">TRANG CHỦ</Button></Link>
      </div>
    );
  }
}
