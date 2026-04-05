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
import { Suspense } from "react";
import { ActorAvatar } from "@/components/movie/ActorAvatar";

async function RatingsSection({ title, year }: { title: string; year?: number }) {
  let tmdbData: any = null;
  let rtData: any = null;
  let omdbData: any = null;
  let traktData: any = null;

  try {
     const tmdbSearch = await searchTMDBMovie(title).catch(() => null);
     if (tmdbSearch) {
        const { getTMDBMovieDetails } = await import("@/services/tmdb");
        tmdbData = await getTMDBMovieDetails(tmdbSearch.id, tmdbSearch.media_type).catch(() => null);
        const imdbId = tmdbData?.external_ids?.imdb_id;
        
        const promises = [];
        if (imdbId) {
           promises.push(getRTRating(imdbId).then((res: any) => rtData = res).catch(() => null));
           const { getOMDbRatingById } = await import("@/services/omdb");
           promises.push(getOMDbRatingById(imdbId).then((res: any) => omdbData = res).catch(() => null));
        } else {
           const { searchOMDbMovie } = await import("@/services/omdb");
           promises.push(searchOMDbMovie(title, year).then((res: any) => omdbData = res).catch(() => null));
        }
        promises.push(getTraktRating(title, year).then((res: any) => traktData = res).catch(() => null));
        await Promise.all(promises);
     }
  } catch (e) {
     console.error("TopXX Ratings Fetch Error:", e);
  }

  if (!tmdbData && !omdbData && !traktData && !rtData) return null;

  return (
    <div className="pt-2 max-w-sm">
      <MovieRatings
        tmdbRating={tmdbData?.vote_average}
        imdbId={tmdbData?.external_ids?.imdb_id}
        imdbRating={omdbData?.vote_average}
        rottenRating={rtData?.criticScore}
        audienceScore={rtData?.audienceScore}
        traktRating={traktData?.rating}
        className="bg-surface p-4 rounded-2xl border border-foreground/5 shadow-apple-sm scale-90 origin-left animate-in fade-in zoom-in duration-500"
      />
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <div className="pt-2 max-w-sm">
       <div className="bg-surface p-4 rounded-2xl border border-foreground/5 shadow-apple-sm scale-90 origin-left h-[88px] animate-pulse flex items-center justify-between px-6">
          <div className="w-12 h-12 bg-foreground/10 rounded-full" />
          <div className="w-12 h-12 bg-foreground/5 rounded-full" />
          <div className="w-12 h-12 bg-foreground/5 rounded-full" />
       </div>
    </div>
  );
}

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
    const isAVDB = slug.startsWith('av-');
    let item: any = null;

    if (isAVDB) {
      const { getAVDBDetails } = await import("@/services/api/avdb");
      item = await getAVDBDetails(slug.replace('av-', ''));
    } else {
      item = await getTopXXDetails(slug);
    }

    if (!item) return notFound();

    // Normalize AVDB data to match TopXX structure
    if (isAVDB || item.source === 'avdb') {
      item.trans = [{ locale: "vi", title: item.name, content: item.content || item.description }];
      item.quality = item.quality || "HD";
      item.views = item.views || 0;
      item.posterUrl = item.poster_url || item.posterUrl;
      item.duration = item.duration || "N/A";
      item.publish_at = item.created_at || item.release || item.year;
      item.year = item.year || (item.created_at ? item.created_at.split('-')[0] : undefined);
      
      // Handle actors array or string to array
      if (Array.isArray(item.actor)) {
         item.actors = item.actor.map((name: string) => ({ name: name.trim(), slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
      } else if (typeof item.actor === 'string' && item.actor) {
        item.actors = item.actor.split(',').map((name: string) => ({
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        }));
      }

      // Handle genres/category
      if (Array.isArray(item.category)) {
         item.genres = item.category.map((c: string) => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
      } else if (item.class_name) {
        item.genres = [{ name: item.class_name, slug: 'avdb' }];
      }

      // Handle country
      if (Array.isArray(item.country)) {
         item.countries = item.country.map((c: string) => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
      }

      // Handle director/writer
      if (Array.isArray(item.director)) {
         item.directors = item.director.map((c: string) => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
      }
      
      if (Array.isArray(item.writer)) {
         item.writers = item.writer.map((c: string) => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
      }

      item.code = item.movie_code || item.id;
    }

    const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
    const sources = item.sources || [];
    
    if (sources.length === 0) return notFound();

    const currentIdx = s ? parseInt(s) : 0;
    const currentSource = sources[currentIdx] || sources[0];

    const prevSourceIdx = currentIdx > 0 ? currentIdx - 1 : null;
    const nextSourceIdx = currentIdx < sources.length - 1 ? currentIdx + 1 : null;
    const reqTitle = (viTrans as any)?.title || (item as any)?.title || (item as any)?.name;
    const reqYear = item.publish_at ? new Date(item.publish_at).getFullYear() : undefined;

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
                isHls={currentSource.isHls || (currentSource.link || "").includes('.m3u8')}
                rawEmbedUrl={currentSource.link || ""}
                movieTitle={(viTrans as any)?.title || (item as any)?.title || (item as any)?.name}
                movieSlug={slug}
                posterUrl={item.posterUrl}
                source="topxx"
             />
          </div>
        </div>

        <div className="px-4 lg:px-8 py-12 flex flex-col gap-12">
            {/* ─── TITLE + ACTIONS ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
               <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                      {/* Metadata Badges */}
                      <div className="flex flex-wrap gap-2">
                        {item.year && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">Year</span>
                            <span className="text-[10px] font-black text-foreground/80">{item.year}</span>
                          </div>
                        )}
                        {(item as any).countries?.length > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">Country</span>
                            <span className="text-[10px] font-black text-foreground/80">
                              {(item as any).countries.map((c: any) => c.name).join(', ')}
                            </span>
                          </div>
                        )}
                        {(item as any).duration && (item as any).duration !== 'N/A' && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">Length</span>
                            <span className="text-[10px] font-black text-foreground/80">{(item as any).duration}</span>
                          </div>
                        )}
                        {(item as any).code && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest italic">Code</span>
                            <span className="text-[10px] font-black text-primary uppercase">{(item as any).code}</span>
                          </div>
                        )}
                        {(item as any).quality && (
                          <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black text-yellow-500 uppercase italic">
                            {(item as any).quality}
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      {((item as any).genres?.length > 0 || (item as any).category?.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {((item as any).genres || (item as any).category || []).map((g: any, i: number) => {
                            // TopXX genres have {code, trans:[{name}]} structure, AVDB genres have {name, slug}
                            const genreName = typeof g === 'string' ? g : 
                              (g.name || g.trans?.find((t: any) => t.locale === 'vi')?.name || g.trans?.[0]?.name || '');
                            if (!genreName) return null;
                            const genreSlug = typeof g === 'string' ? g.toLowerCase().replace(/[^a-z0-9]+/g, '-') :
                              (g.slug || g.code || g.trans?.find((t: any) => t.locale === 'vi')?.slug || g.trans?.[0]?.slug || genreName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                            return (
                              <Link key={i} href={`/${TOPXX_PATH}/the-loai/${genreSlug}`} className="text-[10px] font-black text-foreground/30 uppercase italic tracking-wider hover:text-yellow-500 transition-colors">
                                #{genreName}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-foreground uppercase italic tracking-tighter leading-tight">
                     {(viTrans as any)?.title || (item as any)?.title || (item as any)?.name}
                     <span className="text-yellow-500 ml-4 block sm:inline text-2xl md:text-3xl">#SV{currentIdx + 1}</span>
                  </h1>

                  {/* Genres */}
                  {(item as any).genres?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(item as any).genres.map((g: any, i: number) => {
                        const genreName = typeof g === 'string' ? g :
                          (g.name || g.trans?.find((t: any) => t.locale === 'vi')?.name || g.trans?.[0]?.name || '');
                        if (!genreName) return null;
                        const genreSlug = typeof g === 'string' ? g.toLowerCase().replace(/[^a-z0-9]+/g, '-') :
                          (g.slug || g.code || g.trans?.find((t: any) => t.locale === 'vi')?.slug || g.trans?.[0]?.slug || genreName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                        return (
                          <Link key={g.slug || g.code || i} href={`/${TOPXX_PATH}/the-loai/${genreSlug}`} className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/40 text-[10px] font-black uppercase tracking-widest italic hover:bg-yellow-500/10 hover:border-yellow-500/20 hover:text-yellow-500 transition-all">
                            {genreName}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Ratings for TopXX */}
                  <Suspense fallback={<RatingsSkeleton />}>
                     <RatingsSection title={reqTitle} year={reqYear} />
                  </Suspense>

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

               {/* Cover Image */}
               {item.posterUrl && (
                 <div className="w-full md:w-48 lg:w-64 flex-shrink-0">
                   <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden border border-yellow-500/10 shadow-2xl">
                     <img src={item.posterUrl} alt={(viTrans as any)?.title || ""} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                   </div>
                 </div>
               )}
            </div>

            {/* ─── ACTORS PANEL ──────────────────────────────────── */}
            {((item as any).actors?.length > 0 || (item as any).actor) && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full" />
                  <h3 className="text-[11px] font-black text-foreground/20 uppercase tracking-[0.4em]">Diễn viên</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {(Array.isArray((item as any).actors) ? (item as any).actors : 
                    (typeof (item as any).actor === 'string' ? (item as any).actor.split(',').map((n: string) => ({ name: n.trim() })) : [])
                   ).map((actor: any, idx: number) => {
                    const name = typeof actor === 'string' ? actor : (actor.name || actor.trans?.find((t: any) => t.locale === 'vi')?.name || actor.trans?.[0]?.name || "N/A");
                    const actorSlug = actor.slug || actor.trans?.find((t: any) => t.locale === 'vi')?.slug || actor.trans?.[0]?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    
                    return (
                      <Link
                        key={idx}
                        href={`/${TOPXX_PATH}/dien-vien/${actorSlug}`}
                        className="group flex flex-col items-center gap-2 w-20 text-center"
                      >
                        <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-yellow-500/5 border border-yellow-500/10 group-hover:border-yellow-500/40 transition-all shadow-lg">
                          <ActorAvatar 
                            name={name} 
                            initialThumbnail={actor.thumbnail || actor.avatar} 
                            className="group-hover:scale-110" 
                          />
                        </div>
                        <span className="text-[10px] font-black text-foreground/40 group-hover:text-yellow-500 transition-colors uppercase italic tracking-tight leading-tight line-clamp-2">
                          {name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Server Navigation */}
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

            {/* Description Section */}
            <div className="relative group">
               <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-[0.02] transition-opacity blur-3xl -z-10" />
                <div className="bg-surface border border-foreground/5 rounded-[40px] p-8 md:p-12 transition-all hover:border-yellow-500/20">
                   {((item as any).directors?.length > 0 || (item as any).writers?.length > 0) && (
                      <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-6 text-[11px] font-medium text-foreground/60 italic pb-6 border-b border-foreground/5">
                         {(item as any).directors?.length > 0 && (
                            <div><span className="text-foreground/20 uppercase tracking-widest font-black mr-2">Director:</span> 
                                 {(item as any).directors.map((d: any) => d.name).join(', ')}</div>
                         )}
                         {(item as any).writers?.length > 0 && (
                            <div><span className="text-foreground/20 uppercase tracking-widest font-black mr-2">Writer:</span> 
                                 {(item as any).writers.map((w: any) => w.name).join(', ')}</div>
                         )}
                      </div>
                   )}
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
