// src/app/(phim)/phim/[slug]/page.tsx
// FIXED: Fixed server component crash + Added strict source routing (Hồ Phim vs TopXX) + Fixed missing props
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { MoviePlaySection } from "@/components/movie/MoviePlaySection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie, getTMDBCollection } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";

async function fetchMovieData(slug: string) {
  const isTopXX = slug.startsWith("av-") || /^[A-Z]{2,5}-\d{2,6}$/i.test(slug);
  try {
    const { getMovieDetails } = await import("@/services/api");
    const movie = await getMovieDetails(slug);
    if (movie) return { ...movie, isTopXX };
  } catch (err) {}
  return null;
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const movieRes = await fetchMovieData(slug);
    if (!movieRes) return notFound();
    const { data, source, isTopXX } = movieRes;

    const safeData = {
      name: data.name || data.title || "Đang cập nhật",
      origin_name: data.origin_name || data.original_name || data.movie_code || "",
      year: data.year || "",
      description: data.content || data.description || "",
      poster_url: data.posterUrl || data.poster_url || "",
      actor: Array.isArray(data.actor) ? data.actor : (typeof data.actor === 'string' ? data.actor.split(',') : []),
      category: Array.isArray(data.category) ? data.category : []
    };

    let tmdbData: any = null;
    const sYear = parseInt(safeData.year.toString());
    const searchRes = await searchTMDBMovie(safeData.name, isNaN(sYear) ? undefined : sYear).catch(() => null);
    if (searchRes) tmdbData = await getTMDBMovieDetails(searchRes.id, searchRes.media_type).catch(() => null);

    const poster = tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path, 'w780') : (safeData.poster_url.startsWith("http") ? safeData.poster_url : `https://img.ophim.live/uploads/movies/${safeData.poster_url}`);
    
    // Server normalization 
    const episodes = data.episodes || [];
    const allServers = episodes.map((srv: any, idx: number) => ({
       name: srv.server_name || srv.name || `Server ${idx + 1}`,
       items: srv.server_data || srv.items || []
    }));
    const firstEp = allServers[0]?.items?.[0] || null;

    return (
      <div className={`min-h-screen ${isTopXX ? 'bg-[#0f1115]' : 'bg-background'} text-white pb-20`}>
        <div className="relative h-[65vh] w-full overflow-hidden">
           <img src={poster} className="w-full h-full object-cover opacity-20 blur-2xl scale-110" />
           <div className={`absolute inset-0 bg-gradient-to-t ${isTopXX ? 'from-[#0f1115]' : 'from-background'} to-transparent`} />
        </div>

        <div className="container mx-auto px-4 lg:px-12 -mt-[35vh] relative z-10">
           <div className="flex flex-col lg:flex-row gap-16">
              <div className="w-full lg:w-80 flex-shrink-0 space-y-8">
                 <img src={poster} className="w-full rounded-[45px] shadow-[0_45px_100px_-25px_rgba(0,0,0,0.5)] ring-1 ring-white/10" />
                 <MoviePlaySection 
                   slug={slug} source={source} 
                   firstEp={firstEp ? { name: firstEp.name, slug: firstEp.slug || firstEp.name } : null} 
                   movieTitle={safeData.name} year={safeData.year.toString()} 
                 />
                 <WatchlistBtn movieSlug={slug} movieTitle={safeData.name} posterUrl={poster} />
              </div>

              <div className="flex-1 min-w-0 space-y-12">
                 <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{safeData.name}</h1>
                    <p className="text-2xl text-white/30 font-black italic tracking-widest">{safeData.origin_name}</p>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <span className="px-5 py-2 rounded-2xl bg-primary text-white font-black text-xs uppercase italic tracking-widest">{data.quality || "HD"}</span>
                    <span className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black italic">{safeData.year}</span>
                 </div>

                 <div className="py-10 border-y border-white/5">
                    <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                 </div>

                 <p className="text-xl text-white/50 leading-relaxed italic">{tmdbData?.overview || safeData.description}</p>
                 
                 <MovieTabs 
                    slug={slug} source={source} servers={allServers} 
                    recommendations={tmdbData?.recommendations?.results || []}
                    collection={tmdbData?.belongs_to_collection}
                 />
                 <CastSection actors={tmdbData?.credits?.cast?.slice(0, 10) || []} />
              </div>
           </div>
        </div>
      </div>
    );
  } catch (err: any) {
    console.error("PAGE CRASH:", err);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
        <Play className="w-20 h-20 text-red-600 mb-10 rotate-90" />
        <h1 className="text-3xl font-black uppercase italic mb-4">Hồ Phim - Bảo trì hệ thống</h1>
        <p className="text-white/40 mb-10">{err.message}</p>
        <Link href="/"><Button size="lg" className="rounded-2xl px-12 bg-blue-600 font-black italic tracking-widest">TRANG CHỦ</Button></Link>
      </div>
    );
  }
}
