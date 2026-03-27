// src/app/(phim)/xem/[...slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Star, Calendar, Clock, Tag, User, Users, Info, ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie } from "@/services/tmdb";
import { getMovieDetails } from "@/services/api";
import { getMovieSource, normalizeMovieData } from "@/lib/movie-utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sv?: string; ep?: string; src?: string }>;
}

export default async function CatchAllWatchPage({ params, searchParams }: PageProps) {
  const [{ slug: slugParts }, { sv, ep, src }] = await Promise.all([params, searchParams]);
  
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
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Backdrop Hero - Apple HIG style subtle depth */}
        <div className="relative w-full h-[60vh] flex flex-col justify-end pt-24 pb-12 overflow-hidden shadow-sm">
           <div className="absolute inset-0 z-0">
              <img src={backdrop} className="w-full h-full object-cover blur-2xl scale-110 opacity-40 dark:opacity-30" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
           </div>
           <div className="container mx-auto px-4 md:px-12 relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-end">
                 {/* Desktop Poster */}
                 <div className="hidden md:block w-56 flex-shrink-0">
                    <div className="relative aspect-[2/3] rounded-[16px] overflow-hidden shadow-2xl">
                       <img src={poster} className="w-full h-full object-cover" alt={safeData.name} />
                    </div>
                 </div>
                 <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                       <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">{safeData.name}</h1>
                       <div className="flex flex-wrap items-center gap-3 text-foreground-secondary text-sm font-medium">
                          <p>{safeData.originName}</p>
                          <span className="w-1 h-1 rounded-full bg-separator" />
                          <p>{safeData.year}</p>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="px-3 py-1 rounded-full backdrop-blur-md bg-primary text-white text-[10px] font-bold uppercase tracking-wider">{safeData.quality}</span>
                        {safeData.category.slice(0, 3).map((cat: any, i: number) => (
                           <span key={i} className="px-3 py-1 rounded-full backdrop-blur-md bg-foreground/5 text-foreground-secondary text-[10px] font-bold uppercase tracking-wider">{typeof cat === 'string' ? cat : cat.name}</span>
                        ))}
                    </div>
                    <div className="py-2">
                       <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                    </div>
                 </div>
                 <div className="md:mb-4">
                    <WatchlistBtn movieSlug={movieSlug} movieTitle={safeData.name} posterUrl={poster} />
                 </div>
              </div>
           </div>
        </div>

        {/* Player Section */}
        <div className="py-8 md:py-16">
            <div className="container mx-auto px-4 md:px-12">
               <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 md:gap-12 items-start">
                  {/* Left Column: Player and Tabs */}
                  <div className="w-full space-y-8">
                     {activeServerGroup.length > 0 ? (
                        <div className="rounded-[20px] overflow-hidden shadow-xl bg-surface">
                           <PlayerContainer 
                              url={currentEp.link_m3u8} isHls={!!currentEp.link_m3u8} rawEmbedUrl={currentEp.link_embed}
                              movieTitle={safeData.name} movieSlug={movieSlug} episodeName={currentEp.name}
                              episodeSlug={currentEp.slug} posterUrl={poster} source={sourceId} nextEpisodeUrl={nextEpisodeUrl}
                           />
                        </div>
                     ) : (
                        <div className="aspect-video w-full rounded-[20px] bg-surface flex flex-col items-center justify-center p-8 text-center gap-4">
                           <Calendar size={48} className="text-primary/50" />
                           <div className="space-y-1">
                              <h3 className="text-lg font-bold">Chưa có bản phát sóng</h3>
                              <p className="text-foreground-secondary text-xs">Phim đang chờ cập nhật. Vui lòng quay lại sau.</p>
                           </div>
                        </div>
                     )}
                     
                     <div className="space-y-4">
                        <CastSection actors={tmdbData?.credits?.cast || []} />
                        <div className="h-[1px] bg-separator w-full my-8" />
                        <MovieTabs slug={movieSlug} source={sourceId} servers={allServers} recommendations={tmdbData?.recommendations?.results || []} collection={tmdbData?.belongs_to_collection} />
                     </div>
                  </div>

                  {/* Right Column: Episodes & Sources */}
                  <div className="w-full space-y-10">
                     {/* Sources - Apple style rounded tabs */}
                     {!isTopXX && sources.length > 1 && (
                        <div className="space-y-4">
                           <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-widest pl-1">Phát từ nguồn</h3>
                           <div className="flex flex-wrap gap-2">
                              {sources.map((s: any) => (
                                 <Link 
                                   key={s.id} 
                                   href={`/xem/${movieSlug}?src=${s.id}`} 
                                   className={cn(
                                     "flex-1 min-w-[100px] text-center py-2.5 rounded-full text-xs font-bold transition-all",
                                     sourceId === s.id ? 'bg-primary text-white shadow-md' : 'bg-surface text-foreground-secondary hover:bg-foreground/10'
                                   )}
                                 >
                                    {s.name}
                                 </Link>
                              ))}
                           </div>
                        </div>
                     )}
                     
                     {/* Episodes List */}
                     <div className="space-y-4">
                        <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-widest pl-1">Chọn tập</h3>
                        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
                           {allServers.map((server: any, sIdx: number) => (
                              <div key={sIdx} className="space-y-3">
                                 <h4 className="text-[11px] font-bold text-primary/80 uppercase tracking-widest px-1">{server.name}</h4>
                                 <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                                    {server.items.map((epItem: any, idx: number) => (
                                       <Link key={idx} href={`/xem/${movieSlug}?sv=${sIdx}&ep=${encodeURIComponent(epItem.slug || epItem.name)}&src=${sourceId}`}>
                                          <button className={cn(
                                            "w-full py-2 text-xs font-bold rounded-lg transition-all",
                                            (sIdx === currentServerIdx && (epItem.slug === currentEp.slug || epItem.name === currentEp.name)) 
                                              ? 'bg-primary text-white shadow-sm' 
                                              : 'bg-surface text-foreground-secondary hover:bg-foreground/10'
                                          )}>
                                             {epItem.name}
                                          </button>
                                       </Link>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Sidebar Overview */}
                     <div className="pt-4 space-y-4">
                        <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-widest pl-1">Nội dung</h3>
                        <p className="text-sm leading-relaxed text-foreground-secondary">{tmdbData?.overview || safeData.description}</p>
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
