// Fixed TopXX password format + Removed pro max words + Fixed modal scroll header on both favorites and detail page + iPhone/iPad optimization
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie, getTMDBCollection } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";
import { TraktWatchedBadge } from "@/components/movie/TraktWatchedBadge";

async function fetchMovieData(slug: string) {
  try {
    const [ng, kk, op] = await Promise.allSettled([
      fetch(`https://phim.nguonc.com/api/film/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
      fetch(`https://phimapi.com/v1/api/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
      fetch(`https://ophim1.com/v1/api/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
    ]);
   
    // KKPhim v1 handle
    if (kk.status === "fulfilled" && kk.value?.status === "success" && kk.value?.data?.item) {
      const item = kk.value.data.item;
      return { source: "kkphim", data: item, episodes: kk.value.data.episodes || item.episodes || [] };
    }
    // OPhim v1 handle
    if (op.status === "fulfilled" && op.value?.status === "success" && op.value?.data?.item) {
      const item = op.value.data.item;
      return { source: "ophim", data: item, episodes: op.value.data.episodes || item.episodes || [] };
    }
    // Fallbacks to old engines if v1 fails
    if (kk.status === "fulfilled" && kk.value?.status === true && kk.value?.movie)
      return { source: "kkphim", data: kk.value.movie, episodes: kk.value.episodes || kk.value.movie.episodes || [] };
    if (op.status === "fulfilled" && op.value?.status === true && op.value?.movie)
      return { source: "ophim", data: op.value.movie, episodes: op.value.episodes || op.value.movie.episodes || [] };
    if (ng.status === "fulfilled" && ng.value?.status === "success" && ng.value?.movie)
      return { source: "nguonc", data: ng.value.movie, episodes: ng.value.episodes || ng.value.movie.episodes || [] };
  } catch (err) {
    console.error("fetchMovieData Error:", err);
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
 
export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const movieRes = await fetchMovieData(slug);
    if (!movieRes) return notFound();
 
    const { data, episodes, source } = movieRes;
    
    // Defensive data sanitization
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
 
    const safeEpisodes = Array.isArray(episodes) ? episodes : [];
 
    // Try to get TMDB/IMDB IDs from source data first
    let tmdbSearchId = safeData.tmdb?.id || data.tmdb_id;
    let imdbSearchId = safeData.imdb?.id || data.imdb_id || data.imdbId;
    let mediaType: "movie" | "tv" = safeData.type === "series" ? "tv" : "movie";
 
    let tmdbData: any = null;
    if (tmdbSearchId) {
      try {
        tmdbData = await getTMDBMovieDetails(parseInt(tmdbSearchId), mediaType);
      } catch (err) {
        console.error("TMDB Detail Fetch Error:", err);
      }
    }
 
    if (!tmdbData) {
      const cleanName = (name: string) => (name || "").replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").trim();
      const searchName = cleanName(safeData.name);
      const searchOrigin = cleanName(safeData.origin_name);
 
      try {
        let tmdbSearch = await searchTMDBMovie(searchName, safeData.year);
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin, safeData.year);
        }
        if (!tmdbSearch) {
          tmdbSearch = await searchTMDBMovie(searchName);
        }
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin);
        }
        
        if (tmdbSearch) {
          tmdbData = await getTMDBMovieDetails(tmdbSearch.id, tmdbSearch.media_type);
        }
      } catch (err) {
        console.error("TMDB Search Error:", err);
      }
    }
    
    const imdbId = tmdbData?.external_ids?.imdb_id || imdbSearchId;
    
    let collectionData = null;
    if (tmdbData?.belongs_to_collection) {
      try {
        collectionData = await getTMDBCollection(tmdbData.belongs_to_collection.id);
      } catch (err) {
        console.error("TMDB Collection Error:", err);
      }
    }
    
    // Extended Ratings fetching (Trakt, RT, IMDb, TMDB)
    const { getIMDbRating } = await import("@/services/imdb");
    const { matchTraktContent, getTraktRatings } = await import("@/lib/trakt");
    const { getRTRating } = await import("@/services/rottenTomatoes");

    const traktType: any = mediaType === "tv" ? "show" : "movie";

    const [realImdbRating, traktMatch, rtData] = await Promise.all([
      imdbId ? getIMDbRating(imdbId).catch(() => null) : Promise.resolve(null),
      matchTraktContent(safeData.name, parseInt(safeData.year.toString()), traktType).catch(() => null),
      imdbId ? getRTRating(imdbId).catch(() => null) : Promise.resolve(null),
    ]);

    let traktRatings = null;
    if (traktMatch?.ids?.trakt) {
      traktRatings = await getTraktRatings(traktType, traktMatch.ids.trakt).catch(() => null);
    }
    
    const tmdbPoster = tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path, 'w780') : null;
    const tmdbThumb = tmdbData?.backdrop_path ? getTMDBImageUrl(tmdbData.backdrop_path, 'w1280') : null;
 
    const poster = tmdbPoster || (safeData.poster_url?.startsWith("http")
      ? safeData.poster_url
      : `https://img.ophim.live/uploads/movies/${safeData.poster_url}`);
      
    const thumb = tmdbThumb || (safeData.thumb_url?.startsWith("http")
      ? safeData.thumb_url
      : `https://img.ophim.live/uploads/movies/${safeData.thumb_url}`);
 
    const { searchTMDBPerson } = await import("@/services/tmdb");

    const tmdbCredits = tmdbData?.credits?.cast || [];
    const tmdbDirectorContent = tmdbData?.credits?.crew?.find((c: any) => c.job === "Director" || c.job === "Đạo diễn")?.name;
 
    const fallbackActors = safeData.actor;
    const fallbackDirector = safeData.director?.[0] || "Đang cập nhật";
    const directorName = tmdbDirectorContent || fallbackDirector;

    // Use TMDB overview if available, otherwise fallback to safeData.description
    const finalDescription = tmdbData?.overview || safeData.description;
 
    const allServers: { name: string; items: any[] }[] = safeEpisodes.map((srv: any, idx: number) => ({
      name: srv.server_name || srv.name || `Server ${idx + 1}`,
      items: Array.isArray(srv.server_data) ? srv.server_data : (Array.isArray(srv.items) ? srv.items : []),
    }));
 
    const defaultServer = allServers[0]?.items || [];
    const firstEp = defaultServer[0];
 
    const genreTags: { name: string; slug: string }[] = safeData.category.map((g: any) =>
      typeof g === "string" ? { name: g, slug: g } : { name: g.name || g, slug: g.slug || g.name || g }
    );
 
    const relatedSlug = genreTags[0]?.slug;
    const related = relatedSlug ? await fetchRelated(relatedSlug).catch(() => []) : [];
    const recommendations = tmdbData?.recommendations?.results || [];

    // --- Actor Profile Resolution ---
    let displayActors: any[] = [];
    if (tmdbCredits.length > 0) {
      displayActors = tmdbCredits.slice(0, 10);
    } else if (fallbackActors.length > 0) {
      // If TMDB cast is missing, try to find profiles for source actors individually
      const actorNames = fallbackActors.filter((n: any) => n && n.trim().length > 0).map((n: any) => n.trim()).slice(0, 10);
      const profiles = await Promise.all(
        actorNames.map(async (name: string) => {
          try {
            const person = await searchTMDBPerson(name).catch(() => null);
            return { name, profile_path: person?.profile_path || null };
          } catch {
            return { name, profile_path: null };
          }
        })
      );
      displayActors = profiles;
    }
    // --------------------------------
    const countryName = safeData.country?.[0]?.name || safeData.country?.[0] || "Đang cập nhật";
 
    return (
      <div className="min-h-screen pb-safe">
      <div className="relative w-full h-[60vh] lg:h-[75vh] min-h-[400px] overflow-hidden">
        <Image
          src={thumb || poster}
          alt={safeData.name}
          fill
          priority
          className="object-cover object-top opacity-50 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[var(--banner-overlay)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/30" />
      </div>

      <div className="container mx-auto px-4 lg:px-12 relative z-10 -mt-64 sm:-mt-80 lg:-mt-96 pb-20 md:pb-16 px-safe">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[280px] flex-shrink-0">
              <div className="relative w-[160px] sm:w-[200px] lg:w-full mx-auto lg:mx-0">
                <img
                  src={poster}
                  alt={safeData.name}
                  className="w-full rounded-xl shadow-2xl shadow-black/60 aspect-[2/3] object-cover"
                />
              </div>
 
              <div className="flex flex-col items-center lg:items-stretch gap-3 mt-4">
                {firstEp ? (
                  <Link href={`/xem/${source}/${slug}/${firstEp.slug || firstEp.name}`} className="w-full">
                    <Button className="w-full h-11 rounded-xl gap-2 font-semibold text-[14px] bg-primary hover:bg-primary-hover transition-all">
                      <Play className="w-5 h-5 fill-current" />
                      XEM NGAY
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full h-11 rounded-xl bg-white/5 text-white/30">
                    Phim Sắp Chiếu
                  </Button>
                )}
 
                <div className="flex items-center justify-center gap-4">
                  <WatchlistBtn
                    movieSlug={slug}
                    movieTitle={safeData.name}
                    posterUrl={poster}
                  />
                </div>
              </div>
 
              <div className="mt-6 text-center lg:text-left">
                <h1 className="text-xl font-bold text-foreground leading-snug">{tmdbData?.title || safeData.name}</h1>
                <p className="text-[13px] text-foreground/30 mt-0.5 italic">
                  {tmdbData?.original_title || safeData.origin_name}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                   <span className="text-[12px] text-foreground/40 font-medium">Đạo diễn:</span>
                   <span className="text-[12px] text-primary font-bold tracking-wide uppercase">{directorName}</span>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mt-3">
                  <TraktWatchedBadge 
                    movieTitle={safeData.name} 
                    year={tmdbData?.release_date?.split("-")[0] || tmdbData?.first_air_date?.split("-")[0] || safeData.year} 
                  />
                  <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-[11px] font-semibold">
                    {safeData.quality}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-foreground/5 text-foreground/50 text-[11px] font-medium">
                    {tmdbData?.release_date?.split("-")[0] || tmdbData?.first_air_date?.split("-")[0] || safeData.year}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-foreground/5 text-foreground/50 text-[11px] font-medium">
                    {safeData.episode_current}
                  </span>
                </div>

                <div className="mt-8 mb-4">
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
 
                {genreTags.length > 0 && (
                  <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 mt-3">
                    {genreTags.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/the-loai/${g.slug}`}
                        className="px-2.5 py-1 rounded-md text-[11px] bg-foreground/5 text-foreground/40 hover:text-primary hover:bg-foreground/10 transition-all font-medium"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
 

 
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-xl font-black text-foreground uppercase tracking-wider">Giới thiệu</h3>
                </div>
                <div 
                  className="text-foreground/60 text-base leading-relaxed max-w-4xl"
                  dangerouslySetInnerHTML={{ __html: finalDescription }}
                />
              </div>
            </div>
 
            <div className="flex-1 min-w-0">
              <MovieTabs 
                slug={slug}
                source={source}
                servers={allServers}
                recommendations={recommendations}
                collection={collectionData}
              />
 
              <CastSection actors={displayActors} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("MovieDetailsPage Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Play className="w-8 h-8 text-red-500 rotate-90" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Ối! Có lỗi xảy ra</h1>
        <p className="text-white/40 text-sm max-w-xs mb-8">
          Chúng mình không thể tải thông tin bộ phim này lúc này. Vui lòng thử lại sau hoặc chọn phim khác nhé!
        </p>
        <Link href="/">
          <Button className="rounded-xl px-8 h-11">
            Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }
}
