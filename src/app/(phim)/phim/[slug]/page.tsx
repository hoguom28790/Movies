// FIXED missing Play button on movie detail page - restored Play / "ĐÃ XEM (TRAY)" button with correct positioning and click handler
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Share2, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { MoviePlaySection } from "@/components/movie/MoviePlaySection";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie, getTMDBCollection } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";
import { CastSection } from "@/components/movie/CastSection";
import { TraktWatchedBadge } from "@/components/movie/TraktWatchedBadge";

async function fetchMovieData(slug: string, query?: string) {
  try {
    const fetchWithSources = async (s: string) => {
      const [ng, kk, op] = await Promise.allSettled([
        fetch(`https://phim.nguonc.com/api/film/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
        fetch(`https://phimapi.com/v1/api/phim/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
        fetch(`https://ophim1.com/v1/api/phim/${s}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
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
      return null;
    };

    // 0. Handle search-based slugs (e.g., search?q=Title)
    let finalSlug = slug;
    const searchTarget = query || (slug.includes("search?q=") ? slug.split("q=")[1] : null);
    
    if (slug === "search" || searchTarget) {
        const queryStr = searchTarget || "";
        if (queryStr) {
            const { searchMovies } = await import("@/services/api");
            const res = await searchMovies(decodeURIComponent(queryStr));
            if (res.items.length > 0) finalSlug = res.items[0].slug;
        }
    }

    // 1. Try exact slug fetch
    let movie = await fetchWithSources(finalSlug);
    if (movie) return movie;

    // 2. Fallback: Search by normalized slug
    const searchSlug = finalSlug.replace(/-/g, " ");
    const { searchMovies } = await import("@/services/api");
    const searchResult = await searchMovies(searchSlug);
    if (searchResult?.items?.length > 0) {
      // Find best match in search results
      const bestMatch = searchResult.items.find((i: any) => i.slug === finalSlug) || searchResult.items[0];
      return await fetchWithSources(bestMatch.slug);
    }
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
    let mediaType: "movie" | "tv" = (safeData.tmdb?.type === "tv" || ["series", "hoathinh", "tvshows"].includes(safeData.type)) ? "tv" : "movie";
 
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
        let tmdbSearch = await searchTMDBMovie(searchName, safeData.year, mediaType);
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin, safeData.year, mediaType);
        }
        if (!tmdbSearch) {
          tmdbSearch = await searchTMDBMovie(searchName, undefined, mediaType);
        }
        if (!tmdbSearch && searchOrigin) {
          tmdbSearch = await searchTMDBMovie(searchOrigin, undefined, mediaType);
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
    const firstEp = defaultServer[0] || null;
 
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
 
    return (
      <div className="min-h-screen pb-safe relative">
      <div className="relative w-full h-[60vh] lg:h-[75vh] min-h-[400px] overflow-hidden">
        <Image
          src={thumb || poster}
          alt={safeData.name}
          fill
          priority
          className="object-cover object-top opacity-50 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/30" />
      </div>
 
      <div className="container mx-auto px-4 lg:px-12 relative z-10 -mt-64 sm:-mt-80 lg:-mt-96 pb-20 md:pb-16 px-safe">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="relative w-[180px] sm:w-[220px] lg:w-full mx-auto lg:mx-0 group shadow-2xl shadow-black">
                <img
                  src={poster}
                  alt={safeData.name}
                  className="w-full rounded-[32px] aspect-[2/3] object-cover ring-1 ring-white/10"
                />
                <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/10 group-hover:ring-primary/20 transition-all" />
              </div>
  
              <div className="mt-8">
                 <MoviePlaySection 
                    slug={slug} 
                    source={source} 
                    firstEp={firstEp} 
                    movieTitle={safeData.name}
                    year={safeData.year.toString()}
                    type={mediaType === "tv" ? "show" : "movie"}
                 />
              </div>
 
              <div className="flex items-center justify-center lg:justify-stretch gap-4 mt-6">
                <WatchlistBtn
                  movieSlug={slug}
                  movieTitle={safeData.name}
                  posterUrl={poster}
                />
              </div>
 
              <div className="mt-8 text-center lg:text-left space-y-4">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-foreground leading-[1.1] uppercase italic tracking-tighter drop-shadow-sm font-headline">{tmdbData?.title || safeData.name}</h1>
                  <p className="text-[13px] text-foreground/30 mt-0.5 italic uppercase font-black tracking-widest">
                    {tmdbData?.original_title || safeData.origin_name}
                  </p>
                </div>
 
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3">
                   <div className="flex items-center gap-2">
                     <span className="text-[11px] text-foreground/30 font-black uppercase tracking-widest italic">Đạo diễn:</span>
                     <span className="text-[11px] text-primary font-black uppercase tracking-widest italic bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">{directorName}</span>
                   </div>
                </div>
 
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase italic tracking-widest shadow-lg shadow-primary/20">
                    {safeData.quality}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-foreground/5 text-foreground/50 text-[11px] font-black italic tracking-widest border border-white/5">
                    {tmdbData?.release_date?.split("-")[0] || tmdbData?.first_air_date?.split("-")[0] || safeData.year}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-foreground/5 text-foreground/50 text-[11px] font-black italic tracking-widest border border-white/5">
                    {safeData.episode_current}
                  </span>
                </div>
 
                <div className="py-6 border-y border-white/5">
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
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                    {genreTags.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/the-loai/${g.slug}`}
                        className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-foreground/5 text-foreground/30 hover:text-white hover:bg-primary transition-all uppercase italic tracking-[0.2em] border border-white/5"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
 
              <div className="mt-12 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-lg font-black text-foreground uppercase tracking-[0.3em] italic">Storyline</h3>
                </div>
                <div 
                  className="text-foreground/50 text-base leading-relaxed italic"
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
        <div className="w-20 h-20 rounded-[32px] bg-red-500/10 flex items-center justify-center mb-8 shadow-2xl">
          <Play className="w-10 h-10 text-red-500 rotate-90" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Hệ thống đang bảo trì</h1>
        <p className="text-white/40 text-[13px] font-medium max-w-xs mb-10 italic uppercase tracking-widest">
           Chúng mình đang nâng cấp dữ liệu cho bộ phim này. Vui lòng quay lại sau vài phút!
        </p>
        <Link href="/">
          <Button className="rounded-[24px] px-12 h-14 font-black uppercase italic tracking-widest text-[13px]">
            Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }
}
