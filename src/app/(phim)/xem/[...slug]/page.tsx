// src/app/(phim)/xem/[...slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Star, Calendar, Clock, Tag, User, Users, Info, ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { FavoriteActorBtn } from "@/components/movie/FavoriteActorBtn";
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
    querySource = slugParts[0];
    movieSlug = slugParts[1];
    queryEpisode = slugParts[2];
  } else {
    movieSlug = slugParts[slugParts.length - 1] || "";
  }

  const currentServerIdx = sv ? parseInt(sv) : 0;
  const currentEpisodeSlug = queryEpisode || ep || "";

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
    const decodedEpSlug = decodeURIComponent(currentEpisodeSlug);
    const currentEpIdx = (currentEpisodeSlug && activeServerGroup.length > 0) ? activeServerGroup.findIndex((e: any) => e.slug === decodedEpSlug || e.name === decodedEpSlug) : 0;
    const currentEp = activeServerGroup[currentEpIdx >= 0 ? currentEpIdx : 0] || activeServerGroup[0];

    if (!currentEp) return notFound();

    const nextEp = activeServerGroup[currentEpIdx + 1] || null;
    const nextEpisodeUrl = nextEp ? `/xem/${movieSlug}?sv=${currentServerIdx}&ep=${encodeURIComponent(nextEp.slug)}&src=${sourceId}` : undefined;

    return (
      <div className={`min-h-screen ${isTopXX ? 'bg-[#0f1115]' : 'bg-background'} text-white overflow-x-hidden`}>
        <div className="relative w-full h-auto flex flex-col justify-end pt-24 lg:pt-32 pb-12 lg:pb-16 overflow-hidden">
           <div className="absolute inset-0 z-0">
              <img src={backdrop} className="w-full h-full object-cover opacity-30 blur-sm scale-105" alt="" />
              <div className={`absolute inset-0 bg-gradient-to-t ${isTopXX ? 'from-[#0f1115]' : 'from-background'} via-transparent to-transparent`} />
              <div className={`absolute inset-0 bg-gradient-to-b ${isTopXX ? 'from-[#0f1115]/80' : 'from-background/80'} via-transparent to-transparent`} />
           </div>
           <div className="container mx-auto px-4 lg:px-12 relative z-10">
              <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
                 <div className="hidden lg:block w-72 flex-shrink-0 group">
                    <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
                       <img src={poster} className="w-full h-full object-cover" alt={safeData.name} />
                        <div className="absolute bottom-6 right-6">
                           <WatchlistBtn 
                             movieSlug={movieSlug} 
                             movieTitle={safeData.name} 
                             posterUrl={poster} 
                             variant="compact"
                           />
                        </div>
                    </div>
                 </div>
                 <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                       <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] text-white">{safeData.name}</h1>
                       <div className="flex flex-wrap items-center gap-4 text-white/40">
                          <p className="text-xl md:text-2xl font-black italic tracking-widest uppercase">{safeData.originName}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          <p className="text-xl md:text-2xl font-black italic tracking-tighter">{safeData.year}</p>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                       <span className="px-4 py-1.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase italic tracking-widest">{safeData.quality}</span>
                        {safeData.category.slice(0, 3).map((cat: any, i: number) => (
                           <span key={i} className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/30 font-black text-[10px] uppercase italic tracking-widest">{typeof cat === 'string' ? cat : cat.name}</span>
                        ))}
                    </div>
                     <div className="flex flex-wrap items-center gap-8 py-4 border-y border-white/5">
                        <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                        <div className="lg:hidden">
                           <WatchlistBtn movieSlug={movieSlug} movieTitle={safeData.name} posterUrl={poster} />
                        </div>
                     </div>
                    <p className="text-xl text-white/60 leading-relaxed italic line-clamp-2 lg:line-clamp-3 max-w-4xl">{tmdbData?.overview || safeData.description}</p>
                 </div>
              </div>
           </div>
        </div>
         {/* Main content grid: Top-level Flex/Col for Mobile, Grid for Desktop */}
         <div className="bg-black/10 backdrop-blur-3xl py-10 lg:py-20 relative pb-[calc(var(--mobile-nav-h)+4rem)] lg:pb-32">
            <div className="container mx-auto px-4 lg:px-12">
               <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-16 items-start">
                  {/* Left Column: Player & Meta */}
                  <div className="w-full flex-1 min-w-0 space-y-8 lg:space-y-12">
                     {activeServerGroup.length > 0 ? (
                        <PlayerContainer 
                           url={currentEp.link_m3u8} isHls={!!currentEp.link_m3u8} rawEmbedUrl={currentEp.link_embed}
                           movieTitle={safeData.name} movieSlug={movieSlug} episodeName={currentEp.name}
                           episodeSlug={currentEp.slug} posterUrl={poster} source={sourceId} nextEpisodeUrl={nextEpisodeUrl}
                        />
                     ) : (
                        <div className="aspect-video w-full rounded-[32px] glass-pro bg-white/5 flex flex-col items-center justify-center p-8 lg:p-12 text-center gap-6 border border-white/10">
                           <Calendar className="w-10 h-10 text-primary animate-pulse" />
                           <div className="space-y-2 text-white">
                              <h3 className="text-xl lg:text-2xl font-black italic uppercase tracking-widest">Chưa có bản phát sóng</h3>
                              <p className="text-white/40 text-[10px] lg:text-xs italic">Tiêu đề này đang cập nhật link phim. Vui lòng quay lại sau.</p>
                           </div>
                        </div>
                     )}
                     
                     {/* MOBILE ONLY: Source & Episodes (Hidden on Desktop) */}
                     <div className="block lg:hidden space-y-10">
                         {!isTopXX && sources.length > 1 && (
                             <div className="space-y-6">
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] italic flex items-center gap-3">
                                   <div className="w-1 h-3 bg-primary rounded-full transition-all" />
                                   CHỌN NGUỒN
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                   {sources.map((s: any) => (
                                      <Link key={s.id} href={`/xem/${movieSlug}?src=${s.id}`} className={`text-center py-4 rounded-2xl text-[11px] font-black uppercase italic tracking-widest transition-all ${sourceId === s.id ? 'bg-primary text-white shadow-cinematic-lg' : 'bg-white/[0.03] border border-white/5 text-white/40 hover:bg-white/10'}`}>{s.name}</Link>
                                   ))}
                                </div>
                             </div>
                         )}
                         <div className="space-y-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] italic flex items-center gap-3">
                               <div className="w-1 h-3 bg-primary rounded-full transition-all" />
                               DANH SÁCH TẬP
                            </h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                               {(allServers[currentServerIdx]?.items || allServers[0]?.items || []).map((epItem: any, idx: number) => (
                                  <Link key={idx} href={`/xem/${movieSlug}?sv=${currentServerIdx}&ep=${encodeURIComponent(epItem.slug || epItem.name)}&src=${sourceId}`}>
                                     <button className={`w-full py-3.5 text-[11px] font-black italic rounded-xl border transition-all ${((epItem.slug === currentEp.slug || epItem.name === currentEp.name)) ? 'bg-primary border-primary text-white shadow-cinematic' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                        {epItem.name}
                                     </button>
                                  </Link>
                               ))}
                            </div>
                         </div>
                     </div>

                     <CastSection actors={tmdbData?.credits?.cast || []} />
                     <MovieTabs slug={movieSlug} source={sourceId} servers={allServers} recommendations={tmdbData?.recommendations?.results || []} collection={tmdbData?.belongs_to_collection} />
                  </div>

                  {/* Desktop Right Column: Sidebar Contents */}
                  <div className="hidden lg:block w-full space-y-12">
                     {!isTopXX && sources.length > 1 && (
                         <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] italic">Chọn Nguồn</h3>
                            <div className="flex flex-wrap gap-3">
                               {sources.map((s: any) => (
                                  <Link key={s.id} href={`/xem/${movieSlug}?src=${s.id}`} className={`flex-1 min-w-[100px] text-center py-3 rounded-xl text-[11px] font-black uppercase italic tracking-widest border transition-all ${sourceId === s.id ? 'bg-primary border-primary text-white shadow-cinematic' : 'bg-white/[0.04] border-white/5 text-white/30 hover:bg-white/10 hover:border-white/10'}`}>{s.name}</Link>
                               ))}
                            </div>
                         </div>
                     )}
                     
                     <div className="space-y-8">
                        <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] italic">Danh sách tập</h3>
                        <div className="max-h-[700px] overflow-y-auto custom-scrollbar pr-4 space-y-10">
                           {allServers.map((server: any, sIdx: number) => (
                              <div key={sIdx} className="space-y-5">
                                 <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] italic">{server.name}</h4>
                                 <div className="grid grid-cols-4 gap-2">
                                    {server.items.map((epItem: any, idx: number) => (
                                       <Link key={idx} href={`/xem/${movieSlug}?sv=${sIdx}&ep=${encodeURIComponent(epItem.slug || epItem.name)}&src=${sourceId}`}>
                                          <button className={`w-full py-2.5 text-[11px] font-black italic rounded-xl border transition-all ${(sIdx === currentServerIdx && (epItem.slug === currentEp.slug || epItem.name === currentEp.name)) ? 'bg-primary border-primary text-white scale-95 shadow-cinematic' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}>
                                             {epItem.name}
                                          </button>
                                       </Link>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  } catch (err: any) {
    console.error("WATCH PAGE CRITICAL FAILURE:", err);
    return notFound();
  }
}
