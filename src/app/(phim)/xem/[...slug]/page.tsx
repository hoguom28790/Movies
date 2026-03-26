// src/app/(phim)/xem/[...slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Share2 } from "lucide-react";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie } from "@/services/tmdb";
import { getMovieDetails } from "@/services/api";
import { getMovieSource, normalizeMovieData } from "@/lib/movie-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sv?: string; ep?: string; src?: string }>;
}

export default async function CatchAllWatchPage({ params, searchParams }: PageProps) {
  const [{ slug: slugParts }, { sv, ep, src }] = await Promise.all([params, searchParams]);
  
  // Handle both /xem/movie-slug and legacy /xem/source/movie-slug/episode
  let movieSlug = "";
  let querySource = src;
  let queryEpisode = ep;

  if (slugParts.length === 1) {
    movieSlug = slugParts[0];
  } else if (slugParts.length === 3) {
    // Legacy mapping: [source, slug, episode]
    querySource = slugParts[0];
    movieSlug = slugParts[1];
    queryEpisode = slugParts[2];
  } else {
    movieSlug = slugParts[slugParts.length - 1]; // Fallback
  }

  const currentServerIdx = sv ? parseInt(sv) : 0;
  const currentEpisodeSlug = queryEpisode ? decodeURIComponent(queryEpisode) : "";

  try {
    const movieRes = await getMovieDetails(movieSlug);
    if (!movieRes || !movieRes.sources || movieRes.sources.length === 0) return notFound();
    
    const { sources } = movieRes;
    const currentSource = sources.find((s: any) => s.id === (querySource || src)) || sources[0];
    const { data } = currentSource;
    const sourceId = currentSource.id;

    const detectedSource = getMovieSource(movieSlug, sourceId);
    const safeData = normalizeMovieData(data, detectedSource);
    const isTopXX = detectedSource === 'topxx' || detectedSource === 'avdb';

    const sYear = parseInt(safeData.year.toString());
    const tmdbSearch = await searchTMDBMovie(safeData.name, isNaN(sYear) ? undefined : sYear).catch(() => null);
    const tmdbData = tmdbSearch ? await getTMDBMovieDetails(tmdbSearch.id, tmdbSearch.media_type).catch(() => null) : null;

    const poster = (tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path, 'w780') : safeData.posterUrl) || "";
    const backdrop = (tmdbData?.backdrop_path ? getTMDBImageUrl(tmdbData.backdrop_path, 'original') : poster) || "";

    let rawServers = data.servers && Array.isArray(data.servers) ? data.servers : (isTopXX ? [data] : (data.episodes || data.items || []));

    const allServers = rawServers.map((srv: any, idx: number) => {
       const serverItems = srv.episodes || srv.server_data || srv.items || (isTopXX ? (srv.sources || []) : []);
       const items = Array.isArray(serverItems) 
         ? serverItems.map((item: any, idxArr: number) => ({
             name: item.name || (isTopXX ? `Tập ${idxArr + 1}` : (srv.items?.length === 1 ? "Full" : (idxArr + 1).toString())),
             slug: item.slug || item.name || (idxArr + 1).toString(),
             link_m3u8: item.link_m3u8 || (typeof item.link === 'string' && item.link.includes('.m3u8') ? item.link : ""),
             link_embed: item.link_embed || (typeof item.link === 'string' && !item.link.includes('.m3u8') ? item.link : "")
           }))
         : Object.entries(serverItems).map(([name, link]: [string, any]) => {
             const sLink = typeof link === 'object' ? (link.link_m3u8 || link.link_embed || link.link || "") : link;
             return { name, slug: name, link_m3u8: sLink.includes('.m3u8') ? sLink : "", link_embed: !sLink.includes('.m3u8') ? sLink : "" };
           });
       return { name: srv.server || srv.server_name || srv.name || `Nguồn ${idx + 1}`, items };
    });

    if (allServers.length === 0) return notFound();

    const activeServerGroup = allServers[currentServerIdx]?.items || allServers[0]?.items || [];
    const currentEpIdx = currentEpisodeSlug ? activeServerGroup.findIndex((e: any) => e.slug === currentEpisodeSlug || e.name === currentEpisodeSlug) : 0;
    const currentEp = activeServerGroup[currentEpIdx >= 0 ? currentEpIdx : 0] || activeServerGroup[0];

    const nextEp = activeServerGroup[currentEpIdx + 1] || null;
    const nextEpisodeUrl = nextEp ? `/xem/${movieSlug}?sv=${currentServerIdx}&ep=${encodeURIComponent(nextEp.slug)}` : undefined;

    return (
      <div className={`min-h-screen ${isTopXX ? 'bg-[#0f1115]' : 'bg-background'} text-white overflow-x-hidden`}>
        <div className="relative w-full lg:h-[85vh] flex flex-col justify-end pb-20 pt-32 overflow-hidden">
           <div className="absolute inset-0 z-0">
              <img src={backdrop} className="w-full h-full object-cover opacity-30 blur-sm scale-105" alt="" />
              <div className={`absolute inset-0 bg-gradient-to-t ${isTopXX ? 'from-[#0f1115]' : 'from-background'} via-transparent to-transparent`} />
           </div>
           <div className="container mx-auto px-4 lg:px-12 relative z-10">
              <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
                 <div className="hidden lg:block w-72 flex-shrink-0 group">
                    <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden shadow-2xl border border-white/10">
                       <img src={poster} className="w-full h-full object-cover" alt={safeData.name} />
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                          <WatchlistBtn movieSlug={movieSlug} movieTitle={safeData.name} posterUrl={poster} />
                       </div>
                    </div>
                 </div>
                 <div className="flex-1 space-y-8">
                    <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">{safeData.name}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                       <span className="px-4 py-1.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase italic">{safeData.quality}</span>
                       {safeData.category.slice(0, 3).map((cat: any, i: number) => (
                          <span key={i} className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/30 font-black text-[10px] uppercase italic">{typeof cat === 'string' ? cat : cat.name}</span>
                       ))}
                    </div>
                    <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                    <p className="text-xl text-white/60 leading-relaxed italic line-clamp-3 max-w-4xl">{tmdbData?.overview || safeData.description}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-background/50 backdrop-blur-3xl py-12 relative">
           <div className="container mx-auto px-4 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
                 <div className="space-y-8">
                    <PlayerContainer 
                       url={currentEp.link_m3u8} isHls={!!currentEp.link_m3u8} rawEmbedUrl={currentEp.link_embed}
                       movieTitle={safeData.name} movieSlug={movieSlug} episodeName={currentEp.name}
                       episodeSlug={currentEp.slug} posterUrl={poster} source={sourceId} nextEpisodeUrl={nextEpisodeUrl}
                    />
                 </div>
                 <div className="space-y-12">
                    <div className="space-y-8">
                       <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Danh sách tập</h3>
                       <div className="grid grid-cols-4 gap-2">
                          {activeServerGroup.map((epItem: any, idx: number) => (
                             <Link key={idx} href={`/xem/${movieSlug}?sv=${currentServerIdx}&ep=${encodeURIComponent(epItem.slug || epItem.name)}`}>
                                <button className={`w-full py-2.5 text-[11px] font-black italic rounded-xl border transition-all ${idx === currentEpIdx ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                   {epItem.name}
                                </button>
                             </Link>
                          ))}
                       </div>
                    </div>
                    <CastSection actors={tmdbData?.credits?.cast || []} />
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  } catch (err) {
    return notFound();
  }
}
