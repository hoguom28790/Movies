import React from "react";
import Link from "next/link";
import { getMovieDetails } from "@/services/api";
import { searchTMDBMovie, getTMDBMovieDetails } from "@/services/tmdb";
import { normalizeMovieData, getMovieSource } from "@/lib/movie-utils";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { CastSection } from "@/components/movie/CastSection";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Sidebar Content Helper Component
const RightSidebarContent = ({ sources, sourceId, movieSlug, allServers, currentServerIdx, currentEp, isTopXX }: any) => (
   <div className="w-full space-y-10 relative z-10 bg-background/50 backdrop-blur-sm lg:backdrop-blur-none rounded-3xl p-4 lg:p-0">
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
            {allServers?.map((server: any, sIdx: number) => (
               <div key={sIdx} className="space-y-3">
                  <h4 className="text-[11px] font-bold text-primary/80 uppercase tracking-widest px-1">{server?.name || `Server ${sIdx + 1}`}</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                     {(server?.items || server?.server_data || [])?.map((epItem: any, idx: number) => (
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
   </div>
);

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { sv, ep, src } = await searchParams;
  
  const slugParts = slug;
  let movieSlug = "";
  let querySource = "";
  let queryEpisode = "";

  if (slugParts.length === 1) {
    movieSlug = slugParts[0];
  } else if (slugParts.length === 3) {
    querySource = slugParts[0];
    movieSlug = slugParts[1];
    queryEpisode = slugParts[2];
  } else {
    movieSlug = slugParts[slugParts.length - 1] || "";
  }

  const currentServerIdx = sv ? parseInt(sv as string) : 0;
  const currentEpisodeSlug = queryEpisode || (ep as string) || "";

  try {
    const titleQuery = movieSlug.split('-').join(' ');
    const movieResPromise = getMovieDetails(movieSlug);
    const initialTmdbSearchPromise = searchTMDBMovie(titleQuery).catch(() => null);

    let [movieRes, initialTmdbSearch] = await Promise.all([movieResPromise, initialTmdbSearchPromise]);

    let sources = movieRes?.sources || [];
    let currentSource = sources.find((s: any) => s.id === (querySource || src)) || sources[0];
    let data = currentSource?.data;
    let sourceId = currentSource?.id;

    const detectedSource = getMovieSource(movieSlug, sourceId);
    let safeData = data ? normalizeMovieData(data, detectedSource) : null;
    const isTopXX = detectedSource === 'topxx' || detectedSource === 'avdb';

    if (!safeData) {
       console.log(`[WatchPage] Movie not found in providers, attempting TMDB metadata fallback for: ${movieSlug}`);
       // Fallback: If providers fail, use TMDB info to at least show the page
       if (initialTmdbSearch) {
          try {
             const tmdbFull = await getTMDBMovieDetails(initialTmdbSearch.id, initialTmdbSearch.media_type);
             if (tmdbFull && !tmdbFull.status_code) {
                safeData = {
                   name: tmdbFull.title || tmdbFull.name || titleQuery,
                   originName: tmdbFull.original_title || tmdbFull.original_name || "",
                   year: (tmdbFull.release_date || tmdbFull.first_air_date || "").substring(0, 4),
                   description: tmdbFull.overview || "",
                   posterUrl: tmdbFull.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbFull.poster_path}` : "",
                   quality: "HD",
                   category: tmdbFull.genres?.map((g: any) => g.name) || [],
                   country: tmdbFull.production_countries?.map((c: any) => c.name) || [],
                   episodes: [],
                   status: "Sắp chiếu",
                   tmdb_id: tmdbFull.id
                };
             }
          } catch (e) { console.error("[WatchPage] TMDB Fallback failed:", e); }
       }
    }

    if (!safeData) {
       return notFound();
    }

    const tmdbId = safeData.tmdb_id || initialTmdbSearch?.id;
    let tmdbData = null;
    try {
       if (tmdbId) {
          tmdbData = await getTMDBMovieDetails(Number(tmdbId), initialTmdbSearch?.media_type || "movie");
          // If TMDB returns an error response (like 404), treat as null
          if (tmdbData?.status_code || !tmdbData?.id) tmdbData = null;
       }
    } catch (e) {
       console.error("[WatchPage] TMDB fetch failed:", e);
    }
    
    const allServers = safeData.episodes || [];
    const activeServerGroup = (allServers.length > 0) ? (allServers[currentServerIdx]?.items || []) : [];
    const currentEp = activeServerGroup.find((e: any) => e.slug === currentEpisodeSlug || e.name === currentEpisodeSlug) || activeServerGroup[0] || {};
    
    // Find next episode
    let nextEpisodeUrl = null;
    if (activeServerGroup.length > 0) {
        const currentEpIdx = activeServerGroup.indexOf(currentEp);
        if (currentEpIdx !== -1 && currentEpIdx < activeServerGroup.length - 1) {
           const nextEp = activeServerGroup[currentEpIdx + 1];
           nextEpisodeUrl = `/xem/${movieSlug}?sv=${currentServerIdx}&ep=${encodeURIComponent(nextEp.slug || nextEp.name)}&src=${sourceId}`;
        }
    }

    const poster = tmdbData?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : safeData.posterUrl;

    return (
      <div className="min-h-screen bg-background">
         {/* Backdrop Background */}
         <div className="fixed inset-0 -z-10 bg-background">
            <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50" />
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[80%] bg-primary/20 blur-[150px] rounded-full opacity-30 animate-pulse" />
            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[70%] bg-blue-500/10 blur-[130px] rounded-full opacity-20" />
         </div>

         {/* Movie Identity Header */}
         <div className="pt-24 pb-8 md:pt-32 md:pb-12 border-b border-foreground/[0.03] backdrop-blur-sm bg-background/20">
            <div className="container mx-auto px-4 lg:px-12">
               <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                  <div className="space-y-4 max-w-4xl">
                     <div className={cn(
                        "flex flex-wrap gap-2 text-[10px] uppercase tracking-widest italic",
                        isTopXX ? "font-black text-yellow-500" : "font-bold text-primary"
                     )}>
                        <span>{Array.isArray(safeData.category) ? safeData.category.map((c: any) => typeof c === 'string' ? c : c.name).join(", ") : safeData.category}</span>
                        <span className="opacity-30">•</span>
                        <span>{Array.isArray(safeData.country) ? safeData.country.map((c: any) => typeof c === 'string' ? c : c.name).join(", ") : safeData.country}</span>
                     </div>
                     <h1 className={cn(
                        "text-3xl md:text-5xl tracking-tighter leading-none",
                        isTopXX ? "font-black italic uppercase text-white drop-shadow-2xl" : "font-bold text-foreground"
                     )}>
                        {safeData.name}
                     </h1>
                     <div className={cn(
                        "flex flex-wrap items-center gap-4 text-xs italic",
                        isTopXX ? "font-black text-white/40" : "font-bold text-foreground/40"
                     )}>
                        <span className={isTopXX ? "text-white/60" : "text-foreground/60"}>{safeData.originName}</span>
                        <span className="opacity-30">•</span>
                        <span>{safeData.year}</span>
                        {safeData.quality && (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                            isTopXX ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary"
                          )}>{safeData.quality}</span>
                        )}
                        <span className="px-2 py-0.5 bg-foreground/5 rounded text-[9px] font-black uppercase tracking-wider">{safeData.status}</span>
                     </div>
                  </div>
                  <div className="md:mb-4">
                     <WatchlistBtn movieSlug={movieSlug} movieTitle={safeData.name} posterUrl={poster || ""} />
                  </div>
               </div>
            </div>
         </div>

         {/* Player Section */}
         <div className="py-8 md:py-12 overflow-x-clip">
             <div className="container mx-auto px-4 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                   {/* Left Column: Player and Tabs */}
                   <div className="lg:col-span-8 xl:col-span-9 space-y-8 lg:space-y-12">
                      {activeServerGroup.length > 0 ? (
                         <div className="rounded-[20px] overflow-hidden shadow-2xl bg-surface border border-white/5">
                            <PlayerContainer 
                                url={currentEp?.link_m3u8} 
                                isHls={!!currentEp?.link_m3u8} 
                                rawEmbedUrl={currentEp?.link_embed}
                                movieTitle={safeData.name} 
                                movieSlug={movieSlug} 
                                episodeName={currentEp?.name}
                                episodeSlug={currentEp?.slug} 
                                posterUrl={poster || undefined} 
                                source={sourceId} 
                                nextEpisodeUrl={nextEpisodeUrl || undefined}
                            />
                         </div>
                      ) : (
                         <div className="aspect-video w-full rounded-[20px] bg-surface flex flex-col items-center justify-center p-8 text-center gap-4">
                            <Calendar size={48} className="text-primary/50" />
                             <div className="space-y-1">
                                <h3 className="text-lg font-bold">Phim chưa phát hành</h3>
                                <p className="text-foreground-secondary text-xs">Vui lòng quay lại sau.</p>
                             </div>
                         </div>
                      )}
                      
                      {/* Mobile Sidebar: Visible only on small/medium screens */}
                      <div className="lg:hidden">
                         <RightSidebarContent 
                            sources={sources} sourceId={sourceId} movieSlug={movieSlug} 
                            allServers={allServers} currentServerIdx={currentServerIdx} currentEp={currentEp}
                            isTopXX={isTopXX}
                         />
                      </div>

                      <div className="space-y-4">
                         <CastSection actors={tmdbData?.credits?.cast || []} />
                         <div className="h-[1px] bg-separator w-full my-8" />
                         <MovieTabs slug={movieSlug} source={sourceId} servers={allServers} recommendations={tmdbData?.recommendations?.results || []} collection={tmdbData?.belongs_to_collection} />
                      </div>
                   </div>

                   {/* Right Column: Episodes & Sources (Desktop only) */}
                   <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-32">
                      <RightSidebarContent 
                         sources={sources} sourceId={sourceId} movieSlug={movieSlug} 
                         allServers={allServers} currentServerIdx={currentServerIdx} currentEp={currentEp}
                         isTopXX={isTopXX}
                      />
                   </div>
                </div>
             </div>
         </div>
      </div>
    );
  } catch (error) {
    console.error("Watch Page Error:", error);
    return <div className="p-20 text-center opacity-20">Lỗi nạp trang phim</div>;
  }
}
