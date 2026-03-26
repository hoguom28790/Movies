// src/app/(phim)/xem/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Star, Calendar, Clock, Tag, User, Users, Info, ChevronRight, Share2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { FavoriteActorBtn } from "@/components/movie/FavoriteActorBtn";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie } from "@/services/tmdb";
import { getMovieDetails } from "@/services/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sv?: string; ep?: string; src?: string }>;
}

export default async function UnifiedWatchPage({ params, searchParams }: PageProps) {
  const [{ slug }, { sv, ep, src }] = await Promise.all([params, searchParams]);
  
  const currentServerIdx = sv ? parseInt(sv) : 0;
  const currentEpisodeSlug = ep ? decodeURIComponent(ep) : "";

  try {
    // 1. Fetch Movie Data (Hồ Phim logic)
    const movieRes = await getMovieDetails(slug);
    if (!movieRes) return notFound();
    const { data, source } = movieRes;

    const isTopXX = source === 'topxx' || source === 'avdb';

    // 2. Normalize and Clean Data
    const safeData = {
      name: data.name || data.title || "Đang cập nhật",
      origin_name: data.origin_name || data.original_name || data.movie_code || "",
      year: data.year || "",
      description: data.content || data.description || "",
      poster_url: data.posterUrl || data.poster_url || "",
      quality: data.quality || "HD",
      episode_current: data.episode_current || "",
      category: Array.isArray(data.category) ? data.category : [],
      country: Array.isArray(data.country) ? data.country : []
    };

    // 3. Fetch TMDB Enrichment
    const sYear = parseInt(safeData.year.toString());
    const tmdbSearch = await searchTMDBMovie(safeData.name, isNaN(sYear) ? undefined : sYear).catch(() => null);
    const tmdbData = tmdbSearch ? await getTMDBMovieDetails(tmdbSearch.id, tmdbSearch.media_type).catch(() => null) : null;

    const poster = tmdbData?.poster_path 
      ? getTMDBImageUrl(tmdbData.poster_path, 'w780') 
      : (safeData.poster_url.startsWith("http") 
          ? safeData.poster_url 
          : `https://img.ophim.live/uploads/movies/${safeData.poster_url.replace(/^\/+/, '')}`);

    const backdrop = tmdbData?.backdrop_path 
      ? getTMDBImageUrl(tmdbData.backdrop_path, 'original') 
      : poster;

    // 4. Server & Episode Logic
    const episodes = data.episodes || data.items || [];
    const allServers = episodes.map((srv: any, idx: number) => {
       const serverItems = srv.server_data || srv.items || (isTopXX ? srv.sources : []);
       const items = Array.isArray(serverItems) 
         ? serverItems.map((item: any, idxArr: number) => ({
             name: item.name || (isTopXX ? `Source ${idxArr + 1}` : ""),
             slug: item.slug || item.name || "",
             link_m3u8: item.link_m3u8 || item.link || "",
             link_embed: item.link_embed || ""
           }))
         : Object.entries(serverItems).map(([name, link]: [string, any]) => {
             if (typeof link === 'object' && link !== null) {
               return { name: link.name || name, slug: link.slug || name, link_m3u8: link.link_m3u8, link_embed: link.link_embed };
             }
             return { name, slug: name, link_m3u8: link as string, link_embed: "" };
           });

       return {
         name: srv.server_name || srv.name || `Server ${idx + 1}`,
         items
       };
    });

    if (allServers.length === 0) return notFound();

    // Select current server and episode
    const activeServerGroup = allServers[currentServerIdx]?.items || allServers[0]?.items || [];
    const currentEpIdx = currentEpisodeSlug 
      ? activeServerGroup.findIndex((e: any) => e.slug === currentEpisodeSlug || e.name === currentEpisodeSlug)
      : 0;
    const currentEp = currentEpIdx >= 0 ? activeServerGroup[currentEpIdx] : activeServerGroup[0];

    // Determine next episode for auto-play
    const nextEp = activeServerGroup[currentEpIdx + 1] || null;
    const nextEpisodeUrl = nextEp ? `/xem/${slug}?sv=${currentServerIdx}&ep=${encodeURIComponent(nextEp.slug)}` : undefined;

    return (
      <div className={`min-h-screen ${isTopXX ? 'bg-[#0f1115]' : 'bg-background'} text-white overflow-x-hidden`}>
        
        {/* SECTION 1: HERO HEADER (Stitch Style) */}
        <div className="relative w-full lg:h-[85vh] flex flex-col justify-end pb-20 pt-32 overflow-hidden">
           {/* Backdrop Layer */}
           <div className="absolute inset-0 z-0">
              <img src={backdrop} className="w-full h-full object-cover opacity-30 blur-sm scale-105" alt="" />
              <div className={`absolute inset-0 bg-gradient-to-t ${isTopXX ? 'from-[#0f1115]' : 'from-background'} via-transparent to-transparent`} />
              <div className={`absolute inset-0 bg-gradient-to-b ${isTopXX ? 'from-[#0f1115]/80' : 'from-background/80'} via-transparent to-transparent`} />
           </div>

           <div className="container mx-auto px-4 lg:px-12 relative z-10">
              <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
                 {/* Left: Poster (Desktop Only) */}
                 <div className="hidden lg:block w-72 flex-shrink-0 group">
                    <div className="relative aspect-[2/3] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
                       <img src={poster} className="w-full h-full object-cover" alt={safeData.name} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                          <WatchlistBtn movieSlug={slug} movieTitle={safeData.name} posterUrl={poster} />
                       </div>
                    </div>
                 </div>

                 {/* Right: Detailed Info */}
                 <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                       <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] text-white">
                          {safeData.name}
                       </h1>
                       <div className="flex flex-wrap items-center gap-4 text-white/40">
                          <p className="text-xl md:text-2xl font-black italic tracking-widest uppercase">{safeData.origin_name}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                          <p className="text-xl md:text-2xl font-black italic tracking-tighter">{safeData.year}</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                       <span className="px-4 py-1.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase italic tracking-widest">{safeData.quality}</span>
                       <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase italic tracking-widest">
                          {isTopXX ? 'Source: TopXX' : 'Hồ Phim Premium'}
                       </span>
                        {/* Categories & Countries */}
                        {safeData.category.slice(0, 5).map((cat: any, i: number) => {
                           const label = typeof cat === 'string' ? cat : cat.name;
                           const cSlug = typeof cat === 'object' && cat.slug ? cat.slug : label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                           return (
                              <Link 
                                 key={`cat-${i}`} 
                                 href={`/the-loai/${cSlug}`}
                                 className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-primary hover:border-primary/30 transition-all font-black text-[10px] uppercase italic tracking-widest"
                              >
                                 {label}
                              </Link>
                           );
                        })}
                        {safeData.country.slice(0, 2).map((cnt: any, i: number) => {
                           const label = typeof cnt === 'string' ? cnt : cnt.name;
                           const cSlug = typeof cnt === 'object' && cnt.slug ? cnt.slug : label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                           return (
                              <Link 
                                 key={`cnt-${i}`} 
                                 href={`/quoc-gia/${cSlug}`}
                                 className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-primary/40 hover:text-primary hover:border-primary/30 transition-all font-black text-[10px] uppercase italic tracking-widest"
                              >
                                 {label}
                              </Link>
                           );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-8 py-4 border-y border-white/5">
                       <MovieRatings tmdbRating={tmdbData?.vote_average || 0} />
                       <div className="flex items-center gap-6">
                           <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-widest italic">Chia sẻ</span>
                           </button>
                       </div>
                    </div>

                    <p className="text-xl text-white/60 leading-relaxed italic line-clamp-3 max-w-4xl">
                       {tmdbData?.overview || safeData.description || "Chưa có nội dung chi tiết cho bộ phim này."}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 2: PLAYER SECTION (Full Width Layout) */}
        <div className="bg-background/50 backdrop-blur-3xl py-12 relative">
           <div className="container mx-auto px-4 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
                 {/* Left: THE PLAYER */}
                 <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                       <h2 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">
                          <Play className="w-4 h-4 fill-current" />
                          Now Streaming: Tập {currentEp.name}
                       </h2>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Live Content</span>
                          </div>
                       </div>
                    </div>
                    
                    <PlayerContainer 
                       url={currentEp.link_m3u8} 
                       isHls={true} 
                       rawEmbedUrl={currentEp.link_embed}
                       movieTitle={safeData.name}
                       movieSlug={slug}
                       episodeName={currentEp.name}
                       episodeSlug={currentEp.slug}
                       posterUrl={poster}
                       source={source}
                       nextEpisodeUrl={nextEpisodeUrl}
                    />
                 </div>

                 {/* Right: Side Content (Episodes, Server Selector) */}
                 <div className="space-y-12">
                    <div className="space-y-8">
                       <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Danh sách tập</h3>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{allServers[currentServerIdx]?.items.length} EPISODES</p>
                       </div>

                       <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                          {allServers.map((server: any, sIdx: number) => (
                             <div key={sIdx} className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] italic">{server.name}</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
                                   {server.items.map((epItem: any, idx: number) => {
                                      const isCurrent = sIdx === currentServerIdx && (epItem.slug === currentEp.slug || epItem.name === currentEp.name);
                                      return (
                                         <Link 
                                           key={idx} 
                                           href={`/xem/${slug}?sv=${sIdx}&ep=${encodeURIComponent(epItem.slug || epItem.name)}`}
                                           scroll={false}
                                         >
                                            <button className={`w-full py-2.5 text-[11px] font-black italic rounded-xl border transition-all ${isCurrent ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-95' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/40'}`}>
                                               {epItem.name}
                                            </button>
                                         </Link>
                                      );
                                   })}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                     <div className="pt-6 border-t border-white/5">
                        <CastSection actors={tmdbData?.credits?.cast || []} />
                     </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: ADDITIONAL METADATA & RECOMMENDATIONS */}
        <div className="container mx-auto px-4 lg:px-12 py-20 pb-40">
           <div className="space-y-20">
              <MovieTabs 
                slug={slug} 
                source={source} 
                servers={allServers} 
                recommendations={tmdbData?.recommendations?.results || []}
                collection={tmdbData?.belongs_to_collection}
              />
              
              <div className="pt-20 border-t border-white/5">
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-12">Thông tin sản xuất</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Original Language</p>
                       <p className="text-base font-black uppercase text-white">{tmdbData?.original_language === 'en' ? 'English' : tmdbData?.original_language === 'ja' ? 'Japanese' : tmdbData?.original_language === 'ko' ? 'Korean' : 'Vietnamese'}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Runtime</p>
                       <p className="text-base font-black uppercase text-white">{tmdbData?.runtime || "---"} Minutes</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Budget</p>
                       <p className="text-base font-black uppercase text-white">${tmdbData?.budget?.toLocaleString() || "---"}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Official Status</p>
                       <p className="text-base font-black uppercase text-white">{tmdbData?.status || "Released"}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  } catch (err: any) {
    console.error("UNIFIED PAGE CRASH:", err);
    return notFound();
  }
}
