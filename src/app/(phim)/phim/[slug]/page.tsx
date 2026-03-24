// src/app/(phim)/phim/[slug]/page.tsx
// FIXED critical bug: cannot access movie watch page - improved slug search with strong normalization and multi fallback
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { MoviePlaySection } from "@/components/movie/MoviePlaySection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie, getTMDBCollection } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";

const normalizeTitle = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

async function fetchMovieData(slug: string, query?: string) {
  console.log(`[RESOLVER] Searching slug for title: ${slug}, query: ${query || 'N/A'}`);
  
  try {
    const fetchWithSources = async (s: string) => {
      try {
        const [ng, kk, op] = await Promise.allSettled([
          fetch(`https://phim.nguonc.com/api/film/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
          fetch(`https://phimapi.com/v1/api/phim/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
          fetch(`https://ophim1.com/v1/api/phim/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => null),
        ]);
       
        let result = null;
        if (kk.status === "fulfilled" && kk.value?.status === "success" && kk.value?.data?.item)
          result = { source: "kkphim", data: kk.value.data.item, episodes: kk.value.data.episodes || [] };
        else if (op.status === "fulfilled" && op.value?.status === "success" && op.value?.data?.item)
          result = { source: "ophim", data: op.value.data.item, episodes: op.value.data.episodes || [] };
        else if (kk.status === "fulfilled" && kk.value?.status === true && kk.value?.movie)
          result = { source: "kkphim", data: kk.value.movie, episodes: kk.value.episodes || [] };
        else if (op.status === "fulfilled" && op.value?.status === true && op.value?.movie)
          result = { source: "ophim", data: op.value.movie, episodes: op.value.episodes || [] };
        else if (ng.status === "fulfilled" && ng.value?.status === "success" && ng.value?.movie)
          result = { source: "nguonc", data: ng.value.movie, episodes: ng.value.episodes || [] };

        if (result && Array.isArray(result.episodes) && result.episodes.length > 0) return result;
      } catch (e) {}
      return null;
    };

    // 1. Try exact slug
    let movie = await fetchWithSources(slug);
    if (movie) {
      console.log(`[RESOLVER] Found via exact slug: ${slug}`);
      return movie;
    }

    // 2. Try normalized search (Deep Search)
    const { searchMovies } = await import("@/services/api");
    const searchTerms = [
      query,
      slug.replace(/-/g, " "),
      slug.split("-").slice(0, 3).join(" "), // Partial title
    ].filter(Boolean) as string[];

    for (const term of searchTerms) {
      const searchRes = await searchMovies(term);
      if (searchRes?.items?.length > 0) {
         // Try to match best result
         const best = searchRes.items.find((i: any) => normalizeTitle(i.title) === normalizeTitle(term) || normalizeTitle(i.slug) === normalizeTitle(slug)) || searchRes.items[0];
         const detailed = await fetchWithSources(best.slug);
         if (detailed) {
            console.log(`[RESOLVER] Found via search term "${term}": ${best.slug}`);
            return detailed;
         }
      }
    }
  } catch (err) {
    console.error("[RESOLVER] Fatal Error:", err);
  }
  return null;
}
 
async function fetchRelated(genre: string) {
  try {
    const res = await fetch(`https://phimapi.com/v1/api/the-loai/${genre}?page=1`, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000) 
    });
    const json = await res.json();
    return (json.data?.items || []).slice(0, 12);
  } catch {
    return [];
  }
}
 
export default async function MovieDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>, 
  searchParams: Promise<{ q?: string }> 
}) {
  const [{ slug }, { q }] = await Promise.all([params, searchParams]);
  
  try {
    const movieRes = await fetchMovieData(slug, q);
    if (!movieRes) return notFound();
 
    const { data, episodes, source } = movieRes;
    
    // Normalization
    const safeData = {
      name: data.name || "Đang cập nhật",
      origin_name: data.origin_name || data.original_name || "",
      type: data.type || "movie",
      year: data.year || new Date().getFullYear(),
      quality: data.quality || "HD",
      episode_current: data.episode_current || "N/A",
      description: data.description || data.content || "Đang cập nhật nội dung...",
      time: data.time || "Đang cập nhật",
      actor: Array.isArray(data.actor) ? data.actor : (typeof data.actor === 'string' ? data.actor.split(',').map((s: string) => s.trim()) : []),
      director: Array.isArray(data.director) ? data.director : (typeof data.director === 'string' ? [data.director] : []),
      poster_url: data.poster_url || "",
      thumb_url: data.thumb_url || "",
      tmdb: data.tmdb || {},
      imdb: data.imdb || {},
      category: Array.isArray(data.category) ? data.category : (Array.isArray(data.genres) ? data.genres : []),
      country: Array.isArray(data.country) ? data.country : []
    };
 
    let mediaType: "movie" | "tv" = (safeData.tmdb?.type === "tv" || ["series", "hoathinh", "tvshows"].includes(safeData.type) || safeData.episode_current.includes("/")) ? "tv" : "movie";
 
    let tmdbData: any = null;
    const tmdbId = safeData.tmdb?.id || data.tmdb_id;
    if (tmdbId) {
       tmdbData = await getTMDBMovieDetails(parseInt(tmdbId), mediaType).catch(() => null);
    }
    
    if (!tmdbData) {
       const searchRes = await searchTMDBMovie(safeData.name, safeData.year, mediaType).catch(() => null);
       if (searchRes) tmdbData = await getTMDBMovieDetails(searchRes.id, searchRes.media_type).catch(() => null);
    }

    const imdbId = tmdbData?.external_ids?.imdb_id || safeData.imdb?.id || data.imdb_id;
    const traktType: any = mediaType === "tv" ? "show" : "movie";

    let realImdbRating = null, traktMatch = null, rtData = null, traktRatings = null;
    try {
      const { getIMDbRating } = await import("@/services/imdb");
      const { matchTraktContent, getTraktRatings } = await import("@/lib/trakt");
      const { getRTRating } = await import("@/services/rottenTomatoes");

      [realImdbRating, traktMatch, rtData] = await Promise.all([
        imdbId ? getIMDbRating(imdbId).catch(() => null) : Promise.resolve(null),
        matchTraktContent(safeData.name, parseInt(safeData.year.toString()), traktType).catch(() => null),
        imdbId ? getRTRating(imdbId).catch(() => null) : Promise.resolve(null),
      ]);

      if (traktMatch?.ids?.trakt) {
        traktRatings = await getTraktRatings(traktType, traktMatch.ids.trakt).catch(() => null);
      }
    } catch (e) {}

    const tmdbPoster = tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path, 'w780') : null;
    const tmdbThumb = tmdbData?.backdrop_path ? getTMDBImageUrl(tmdbData.backdrop_path, 'w1280') : null;
    const poster = tmdbPoster || (safeData.poster_url?.startsWith("http") ? safeData.poster_url : `https://img.ophim.live/uploads/movies/${safeData.poster_url}`);
    const thumb = tmdbThumb || (safeData.thumb_url?.startsWith("http") ? safeData.thumb_url : `https://img.ophim.live/uploads/movies/${safeData.thumb_url}`);
 
    const tmdbCredits = tmdbData?.credits?.cast || [];
    const directorName = tmdbData?.credits?.crew?.find((c: any) => c.job === "Director")?.name || (safeData.director?.[0] || "Đang cập nhật");
    const allServers = (episodes || []).map((srv: any, idx: number) => ({
      name: srv.server_name || srv.name || `Server ${idx + 1}`,
      items: Array.isArray(srv.server_data) ? srv.server_data : (Array.isArray(srv.items) ? srv.items : []),
    }));
 
    const firstEp = allServers[0]?.items?.[0] || null;
    const genreTags = safeData.category.map((g: any) => typeof g === "string" ? { name: g, slug: g } : { name: g.name || g, slug: g.slug || g.name || g });
    const recommendations = tmdbData?.recommendations?.results || [];
 
    let displayActors: any[] = [];
    if (tmdbCredits.length > 0) {
      displayActors = tmdbCredits.slice(0, 10);
    } else {
      const { searchTMDBPerson } = await import("@/services/tmdb");
      displayActors = await Promise.all(safeData.actor.slice(0, 10).map(async (name: string) => {
          const p = await searchTMDBPerson(name).catch(() => null);
          return { name, profile_path: p?.profile_path || null };
      }));
    }
 
    return (
      <div className="min-h-screen pb-safe bg-[#0a0c10] text-white">
        <div className="relative w-full h-[60vh] lg:h-[80vh] min-h-[500px] overflow-hidden">
          <img src={thumb || poster} alt={safeData.name} className="w-full h-full object-cover object-top opacity-30 blur-[2px] scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/80 to-transparent" />
        </div>
 
        <div className="container mx-auto px-4 lg:px-12 relative z-10 -mt-80 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 xl:col-span-3 space-y-8">
                <div className="relative group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                  <img src={poster} alt={safeData.name} className="w-full rounded-[40px] aspect-[2/3] object-cover ring-1 ring-white/10" />
                  <div className="absolute inset-0 rounded-[40px] bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
    
                <MoviePlaySection 
                  slug={slug} source={source} firstEp={firstEp} movieTitle={safeData.name}
                  year={safeData.year.toString()} type={mediaType === "tv" ? "show" : "movie"}
                />
   
                <div className="flex items-center gap-4">
                  <WatchlistBtn movieSlug={slug} movieTitle={safeData.name} posterUrl={poster} />
                </div>
              </div>
    
              <div className="lg:col-span-8 xl:col-span-9 space-y-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-blue-400 font-black text-[12px] uppercase italic tracking-[0.3em]">
                       <span className="w-8 h-px bg-blue-400 mr-2" />
                       HỒ PHIM PREMIUM
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] drop-shadow-2xl">
                       {tmdbData?.title || safeData.name}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/40 font-black italic uppercase tracking-widest">{tmdbData?.original_title || safeData.origin_name}</p>
                </div>
   
                <div className="flex flex-wrap items-center gap-4">
                  <span className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20">{safeData.quality}</span>
                  <span className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black italic tracking-widest">{safeData.year}</span>
                  <span className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black italic tracking-widest">{safeData.episode_current}</span>
                </div>
 
                <div className="py-8 border-y border-white/5">
                   <MovieRatings 
                     imdbRating={realImdbRating?.rating || safeData.imdb?.vote_average || 0}
                     imdbVotes={realImdbRating?.votes || safeData.imdb?.vote_count || 0}
                     traktRating={traktRatings?.rating || 0}
                     traktVotes={traktRatings?.votes || 0}
                     tmdbRating={tmdbData?.vote_average || safeData.tmdb?.vote_average || 0}
                     rottenRating={rtData?.criticScore || 0}
                     audienceScore={rtData?.audienceScore || 0}
                   />
                </div>
  
                <div className="space-y-4">
                   <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] italic">Storyline</h3>
                   <p className="text-lg md:text-xl text-white/60 leading-relaxed italic">{tmdbData?.overview || safeData.description}</p>
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Details</h4>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-white/40 uppercase">Director:</span>
                            <span className="text-[13px] font-black italic text-blue-400">{directorName}</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {genreTags.map((g: any) => (
                             <Link key={g.slug} href={`/the-loai/${g.slug}`} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase italic tracking-widest hover:bg-white/10 transition-all">
                               {g.name}
                             </Link>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="mt-20 space-y-20">
               <MovieTabs 
                 slug={slug} source={source} servers={allServers} recommendations={recommendations} collection={tmdbData?.belongs_to_collection}
               />
               <CastSection actors={displayActors} />
            </div>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("MovieDetailsPage Fatal Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#0a0c10]">
        <div className="w-24 h-24 rounded-[40px] bg-red-600/10 flex items-center justify-center mb-10 animate-pulse">
           <Play className="w-12 h-12 text-red-600 rotate-90" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Hồ Phim - Hệ thống đang bảo trì</h1>
        <p className="text-white/40 text-[14px] mb-12 italic max-w-sm uppercase tracking-widest">{error.message || "Chúng mình đang cập nhật lại luồng dữ liệu cho bộ phim này. Vui lòng thử lại sau giây lát!"}</p>
        <div className="flex gap-4">
           <Link href="/"><Button size="lg" className="rounded-2xl px-12 h-16 font-black uppercase italic tracking-widest bg-blue-600 hover:bg-blue-700">Trang chủ</Button></Link>
           <Button size="lg" onClick={() => window.location.reload()} variant="secondary" className="rounded-2xl px-12 h-16 font-black uppercase italic tracking-widest">Thử lại</Button>
        </div>
      </div>
    );
  }
}
