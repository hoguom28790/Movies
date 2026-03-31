import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { getTopXXDetails } from "@/services/api/topxx";
import { TOPXX_PATH } from "@/lib/constants";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { getRTRating } from "@/services/rottenTomatoes";
import { getTraktRating } from "@/services/trakt";
import { searchTMDBMovie } from "@/services/tmdb";

export const dynamic = "force-dynamic";

export default async function XXWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { slug } = await params;
  const { s } = await searchParams; // s can be 'hls' or 'embed' or index
  
  try {
    const item = await getTopXXDetails(slug);
    if (!item) return notFound();

    const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
    const sources = item.sources || [];
    
    if (sources.length === 0) return notFound();

    const currentIdx = s ? parseInt(s) : 0;
    const currentSource = sources[currentIdx] || sources[0];

    const prevSourceIdx = currentIdx > 0 ? currentIdx - 1 : null;
    const nextSourceIdx = currentIdx < sources.length - 1 ? currentIdx + 1 : null;

    // Fetch ratings based on title
    let tmdbData = null;
    let rtData = null;
    let omdbData = null;
    let traktData = null;

    try {
       const title = (viTrans as any)?.title || (item as any)?.title || (item as any)?.name;
       const year = item.publish_at ? new Date(item.publish_at).getFullYear() : undefined;
       
       const tmdbSearch = await searchTMDBMovie(title).catch(() => null);
       if (tmdbSearch) {
          const { getTMDBMovieDetails } = await import("@/services/tmdb");
          tmdbData = await getTMDBMovieDetails(tmdbSearch.id, tmdbSearch.media_type).catch(() => null);
          const imdbId = tmdbData?.external_ids?.imdb_id;
          
          const promises = [];
          if (imdbId) {
             promises.push(getRTRating(imdbId).then(res => rtData = res).catch(() => null));
             const { getOMDbRatingById } = await import("@/services/omdb");
             promises.push(getOMDbRatingById(imdbId).then(res => omdbData = res).catch(() => null));
          } else {
             const { searchOMDbMovie } = await import("@/services/omdb");
             promises.push(searchOMDbMovie(title, year).then(res => omdbData = res).catch(() => null));
          }
          promises.push(getTraktRating(title, year).then(res => traktData = res).catch(() => null));
          await Promise.all(promises);
       }
    } catch (e) {
       console.error("TopXX Ratings Fetch Error:", e);
    }

    return (
      <div className="min-h-screen bg-background pt-14 pb-safe max-w-7xl mx-auto">
        <div className="w-full bg-background pt-safe">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link
              href={`/${TOPXX_PATH}/movie/${slug}`}
              className="flex items-center gap-3 text-sm font-bold text-foreground/40 hover:text-foreground transition-all group"
            >
              <div className="p-2 rounded-full bg-foreground/5 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="truncate uppercase italic tracking-widest text-[11px] text-foreground">{(viTrans as any)?.title || (item as any)?.title || (item as any)?.name}</span>
            </Link>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em] mr-2">Servers</span>
              {sources.map((_src: any, idx: number) => (
                <Link key={idx} href={`/${TOPXX_PATH}/watch/${slug}?s=${idx}`} scroll={false} replace>
                  <Button
                    variant={currentIdx === idx ? "primary" : "secondary"}
                    size="sm"
                    className={`h-9 text-[11px] px-5 rounded-xl font-black uppercase italic tracking-tighter transition-all ${
                      currentIdx === idx 
                        ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]" 
                        : "bg-surface border-foreground/5 hover:bg-foreground/10 text-foreground"
                    }`}
                  >
                    SV {idx + 1}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="px-0 sm:px-4 lg:px-8">
             <PlayerContainer 
                url={currentSource.link || ""}
                isHls={(currentSource.link || "").includes('.m3u8')}
                rawEmbedUrl={currentSource.link || ""}
                movieTitle={(viTrans as any)?.title || (item as any)?.title || (item as any)?.name}
                movieSlug={slug}
                posterUrl={item.posterUrl}
                source="topxx"
             />
          </div>
        </div>

        <div className="px-4 lg:px-8 py-12 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl font-black text-foreground uppercase italic tracking-tighter leading-tight">
                     {(viTrans as any)?.title || (item as any)?.title || (item as any)?.name} 
                     <span className="text-yellow-500 ml-4 block sm:inline">#SV{currentIdx + 1}</span>
                  </h1>
                  <div className="flex items-center gap-4">
                     <span className="px-3 py-1 rounded-lg bg-yellow-500 text-black text-[10px] font-black uppercase italic">{item.quality}</span>
                     <span className="text-foreground/40 text-xs font-bold uppercase tracking-widest">{(item as any).duration || ""}</span>
                     <span className="text-foreground/20 text-[10px] font-black uppercase tracking-[0.2em]">{(item as any).views?.toLocaleString() || 0} lượt xem</span>
                  </div>

                  {/* Ratings for TopXX */}
                  {(tmdbData || omdbData || traktData || rtData) && (
                    <div className="pt-2 max-w-sm">
                      <MovieRatings 
                        tmdbRating={tmdbData?.vote_average}
                        imdbId={tmdbData?.external_ids?.imdb_id}
                        imdbRating={omdbData?.vote_average}
                        rottenRating={rtData?.criticScore}
                        traktRating={traktData?.rating}
                        className="bg-surface p-4 rounded-2xl border border-foreground/5 shadow-apple-sm scale-90 origin-left"
                      />
                    </div>
                  )}
                 <div className="pt-4">
                    <WatchlistBtn 
                      isXX
                      movieCode={slug}
                      movieTitle={(viTrans as any)?.title || (item as any)?.title || (item as any)?.name}
                      posterUrl={item.posterUrl || ""}
                      className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                    />
                 </div>
              </div>

               <div className="flex items-center gap-3">
                  {prevSourceIdx !== null ? (
                    <Link href={`/${TOPXX_PATH}/watch/${slug}?s=${prevSourceIdx}`}>
                      <Button variant="secondary" className="h-12 gap-3 font-black uppercase italic text-[11px] tracking-widest px-6 rounded-2xl border-foreground/10 bg-surface text-foreground hover:bg-foreground/10">
                        <ChevronLeft className="w-5 h-5" /> Prev
                      </Button>
                    </Link>
                  ) : (
                    <Link href="#" className="pointer-events-none">
                      <Button variant="secondary" className="h-12 gap-3 font-black uppercase italic text-[11px] tracking-widest px-6 rounded-2xl opacity-20 border-foreground/10 bg-surface/5 text-foreground" disabled>
                        <ChevronLeft className="w-5 h-5" /> Prev
                      </Button>
                    </Link>
                  )}
                  
                  {nextSourceIdx !== null ? (
                    <Link href={`/${TOPXX_PATH}/watch/${slug}?s=${nextSourceIdx}`}>
                      <Button variant="primary" className="h-12 gap-3 font-black uppercase italic text-[11px] tracking-widest px-6 rounded-2xl bg-yellow-500 text-black">
                        Next <ChevronRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="#" className="pointer-events-none">
                      <Button variant="secondary" className="h-12 gap-3 font-black uppercase italic text-[11px] tracking-widest px-6 rounded-2xl opacity-20 border-foreground/10 bg-surface/5 text-foreground" disabled>
                        Next <ChevronRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  )}
               </div>
           </div>

           {/* Description Section */}
           <div className="relative group">
              <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-[0.02] transition-opacity blur-3xl -z-10" />
               <div className="bg-surface border border-foreground/5 rounded-[40px] p-8 md:p-12 transition-all hover:border-yellow-500/20">
                  <h3 className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                     <span className="w-8 h-px bg-foreground/10" /> Nội dung phim
                  </h3>
                  <div 
                    className="text-foreground/60 text-sm md:text-base leading-relaxed md:leading-loose font-medium italic"
                    dangerouslySetInnerHTML={{ __html: (viTrans as any)?.description || (viTrans as any)?.content || (item as any)?.content || (item as any)?.description || "Khám phá câu chuyện hấp dẫn trong tác phẩm điện ảnh đặc sắc này..." }}
                  />
              </div>
           </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("XXWatchPage Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Play className="w-8 h-8 text-red-500 rotate-90" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Ối! Có lỗi trên TopXX</h1>
        <p className="text-foreground/40 text-sm max-w-xs mb-8">
          Chúng tôi không thể tải phim này ngay bây giờ. Thử lại sau nhé!
        </p>
        <Link href={`/${TOPXX_PATH}/movie/${slug}`}>
          <Button className="rounded-xl px-8 h-11 bg-yellow-500 text-black">
            Quay lại trang thông tin
          </Button>
        </Link>
      </div>
    );
  }
}
