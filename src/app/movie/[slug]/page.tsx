import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie, getTMDBCollection } from "@/services/tmdb";
import { MovieTabs } from "@/components/movie/MovieTabs";
import { MovieRatings } from "@/components/movie/MovieRatings";

async function fetchMovieData(slug: string) {
  const [ng, kk, op] = await Promise.allSettled([
    fetch(`https://phim.nguonc.com/api/film/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
    fetch(`https://phimapi.com/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
    fetch(`https://ophim1.com/phim/${slug}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
  ]);

  if (kk.status === "fulfilled" && kk.value?.status === true && kk.value?.movie)
    return { source: "kkphim", data: kk.value.movie, episodes: kk.value.episodes || kk.value.movie.episodes || [] };
  if (op.status === "fulfilled" && op.value?.status === true && op.value?.movie)
    return { source: "ophim", data: op.value.movie, episodes: op.value.episodes || op.value.movie.episodes || [] };
  if (ng.status === "fulfilled" && ng.value?.status === "success" && ng.value?.movie)
    return { source: "nguonc", data: ng.value.movie, episodes: ng.value.episodes || ng.value.movie.episodes || [] };

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
  const movieRes = await fetchMovieData(slug);
  if (!movieRes) return notFound();

  const { data, episodes, source } = movieRes;
  
  // Try to get TMDB/IMDB IDs from source data first
  let tmdbSearchId = data.tmdb?.id || data.tmdb_id;
  let imdbSearchId = data.imdb?.id || data.imdb_id || data.imdbId;
  let mediaType: "movie" | "tv" = data.type === "series" ? "tv" : "movie";

  let tmdbData: any = null;

  if (tmdbSearchId) {
    tmdbData = await getTMDBMovieDetails(parseInt(tmdbSearchId), mediaType);
  }

  // If ID fetch fails or no ID, fallback to title search
  if (!tmdbData) {
    // TMDB Enrichment
    const cleanName = (name: string) => name.replace(/\(Phần\s+\d+\)/gi, "").replace(/\(Season\s+\d+\)/gi, "").trim();
    const searchName = cleanName(data.name);
    const searchOrigin = cleanName(data.origin_name || data.original_name || "");

    let tmdbSearch = await searchTMDBMovie(searchName, data.year);
    if (!tmdbSearch && searchOrigin) {
      tmdbSearch = await searchTMDBMovie(searchOrigin, data.year);
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
  }
  
  const imdbId = tmdbData?.external_ids?.imdb_id || imdbSearchId;
  
  // Fetch collection if exists
  const collectionData = tmdbData?.belongs_to_collection 
    ? await getTMDBCollection(tmdbData.belongs_to_collection.id) 
    : null;
  
  const { getIMDbRating } = await import("@/services/imdb");
  const { getRTRating } = await import("@/services/rottenTomatoes");
  
  const [realImdbRating, rtData] = await Promise.all([
    imdbId ? getIMDbRating(imdbId) : Promise.resolve(null),
    imdbId ? getRTRating(imdbId) : Promise.resolve(null)
  ]);
  
  const tmdbPoster = tmdbData?.poster_path ? getTMDBImageUrl(tmdbData.poster_path) : null;
  const tmdbThumb = tmdbData?.backdrop_path ? getTMDBImageUrl(tmdbData.backdrop_path) : null;

  const poster = tmdbPoster || (data.poster_url?.startsWith("http")
    ? data.poster_url
    : `https://img.ophim.live/uploads/movies/${data.poster_url}`);
    
  const thumb = tmdbThumb || (data.thumb_url?.startsWith("http")
    ? data.thumb_url
    : `https://img.ophim.live/uploads/movies/${data.thumb_url}`);

  const tmdbCredits = tmdbData?.credits?.cast || [];
  const tmdbDirector = tmdbData?.credits?.crew?.find((c: any) => c.job === "Director")?.name;

  const fallbackActors = data.actor || [];
  const fallbackDirector = data.director?.[0] || data.director || "Đang cập nhật";
  const directorName = tmdbDirector || fallbackDirector;

  const allServers: { name: string; items: any[] }[] = episodes.map((srv: any, idx: number) => ({
    name: srv.server_name || srv.name || `Server ${idx + 1}`,
    items: srv.server_data || srv.items || [],
  }));

  const defaultServer = allServers[0]?.items || [];
  const firstEp = defaultServer[0];

  const genreTags: { name: string; slug: string }[] = (data.category || data.genres || []).map((g: any) =>
    typeof g === "string" ? { name: g, slug: g } : { name: g.name || g, slug: g.slug || g.name || g }
  );

  const relatedSlug = genreTags[0]?.slug;
  const related = relatedSlug ? await fetchRelated(relatedSlug).catch(() => []) : [];

  const recommendations = tmdbData?.recommendations?.results || [];

  // Actor display list (combine TMDB + fallback)
  const displayActors = tmdbCredits.length > 0 
    ? tmdbCredits.slice(0, 8) 
    : fallbackActors.slice(0, 8).map((name: string) => ({ name, profile_path: null }));

  const countryName = data.country?.[0]?.name || data.country?.[0] || "Đang cập nhật";

  return (
    <div className="min-h-screen">
      {/* ── Backdrop ── */}
      <div className="relative w-full h-[35vh] sm:h-[40vh] lg:h-[45vh] min-h-[250px] overflow-hidden">
        <img
          src={thumb || poster}
          alt={data.name}
          className="w-full h-full object-cover object-top opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/30" />
      </div>

      {/* ── Main Content: 2-column layout ── */}
      <div className="container mx-auto px-4 lg:px-12 relative z-10 -mt-44 sm:-mt-52 lg:-mt-64 pb-20 md:pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ═══ LEFT COLUMN: Poster + Info ═══ */}
          <div className="w-full lg:w-[280px] flex-shrink-0">
            {/* Poster */}
            <div className="relative w-[160px] sm:w-[200px] lg:w-full mx-auto lg:mx-0">
              <img
                src={poster}
                alt={data.name}
                className="w-full rounded-xl shadow-2xl shadow-black/60 aspect-[2/3] object-cover"
              />
            </div>

            {/* XEM NGAY + Actions */}
            <div className="flex flex-col items-center lg:items-stretch gap-3 mt-4">
              {firstEp ? (
                <Link href={`/watch/${source}/${slug}/${firstEp.slug || firstEp.name}`} className="w-full">
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
                  movieSlug={data.slug}
                  movieTitle={data.name}
                  posterUrl={poster}
                />
                <button className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Movie Title & Tags */}
            <div className="mt-6 text-center lg:text-left">
              <h1 className="text-xl font-bold text-white leading-snug">{tmdbData?.title || data.name}</h1>
              <p className="text-[13px] text-white/30 mt-0.5 italic">
                {tmdbData?.original_title || data.origin_name || data.original_name}
              </p>

              {/* Badge row */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-[11px] font-semibold">
                  {data.quality || "HD"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/50 text-[11px] font-medium">
                  {tmdbData?.release_date?.split("-")[0] || data.year}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/50 text-[11px] font-medium">
                  {data.episode_current || `Tập ${defaultServer.length}`}
                </span>
              </div>

              {/* Genre tags */}
              {genreTags.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 mt-3">
                  {genreTags.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/the-loai/${g.slug}`}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all font-medium"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
 
            {/* ID & Ratings Block */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {/* TMDB Box */}
              {tmdbData?.id || data.tmdb?.id || data.tmdb_id ? (
                <a 
                  href={`https://www.themoviedb.org/${tmdbData?.media_type || (data.type === "series" ? "tv" : "movie")}/${tmdbData?.id || data.tmdb?.id || data.tmdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/40 hover:bg-white/[0.05] transition-all flex flex-col gap-1.5 group/card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">TMDB</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">
                      {tmdbData?.media_type === "tv" || tmdbData?.first_air_date || data.type === "series" ? "TV" : "PHIM"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/30 truncate">ID: {tmdbData?.id || data.tmdb?.id || data.tmdb_id || "N/A"}</p>
                    <p className="text-[13px] font-bold text-white mt-0.5 group-hover/card:text-primary transition-colors">
                      {tmdbData?.vote_average?.toFixed(1) || data.tmdb?.vote_average || "0.0"}{" "}
                      <span className="text-[10px] text-white/30 font-normal">/ 10 ({tmdbData?.vote_count || data.tmdb?.vote_count || 0})</span>
                    </p>
                  </div>
                </a>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5 opacity-50">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">TMDB</span>
                  <p className="text-[11px] text-white/30">ID: N/A</p>
                </div>
              )}
 
              {/* IMDB Box */}
              {imdbId ? (
                <a 
                  href={`https://www.imdb.com/title/${imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-yellow-500/40 hover:bg-white/[0.05] transition-all flex flex-col gap-1.5 group/card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">IMDB</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 uppercase font-bold">
                      RATING
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/30 truncate">ID: {imdbId || "N/A"}</p>
                    <p className="text-[13px] font-bold text-white mt-0.5 group-hover/card:text-yellow-500 transition-colors">
                      {realImdbRating || data.imdb?.vote_average || "0.0"}{" "}
                      <span className="text-[10px] text-white/30 font-normal">/ 10 ({data.imdb?.vote_count || 0})</span>
                    </p>
                  </div>
                </a>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5 opacity-50">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">IMDB</span>
                  <p className="text-[11px] text-white/30">ID: N/A</p>
                </div>
              )}
            </div>
 
            {/* Giới thiệu */}
            <div className="mt-5">
              <h3 className="text-[13px] font-semibold text-white/60 mb-2">Giới thiệu:</h3>
              <div
                className="text-[13px] text-white/40 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: tmdbData?.overview || data.description || data.content || "Đang cập nhật nội dung..." }}
              />
            </div>
 
            {/* Meta info */}
            <div className="mt-4 space-y-1.5 text-[13px]">
              <p>
                <span className="text-white/30 font-medium">Thời lượng: </span>
                <span className="text-white/60">{data.time || "Đang cập nhật"}</span>
              </p>
              <p>
                <span className="text-white/30 font-medium">Quốc gia: </span>
                <span className="text-white/60">{countryName}</span>
              </p>
              <p>
                <span className="text-white/30 font-medium">Đạo diễn: </span>
                <span className="text-white/60">{directorName}</span>
              </p>
            </div>
          </div>
 
          {/* ═══ RIGHT COLUMN: Episodes + Tabs ═══ */}
          <div className="flex-1 min-w-0">
            <MovieTabs 
              slug={slug}
              source={source}
              servers={allServers}
              recommendations={recommendations}
              collection={collectionData}
            />
 
            {/* ── Diễn viên Standalone Section ── */}
            {displayActors.length > 0 && (
              <section className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-base font-semibold text-white/90">Diễn viên</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {displayActors.map((actor: any, idx: number) => (
                    <div key={idx} className="group flex flex-col items-center text-center gap-3">
                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/[0.06] group-hover:border-primary/30 transition-all duration-300 shadow-lg shadow-black/20">
                        {actor.profile_path ? (
                          <img
                            src={getTMDBImageUrl(actor.profile_path) || ""}
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 italic text-[12px] uppercase tracking-widest bg-gradient-to-br from-white/5 to-transparent">
                            {actor.name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="w-full px-1">
                        <p className="text-[13px] font-bold text-white/80 group-hover:text-primary transition-colors line-clamp-1">{actor.name}</p>
                        {actor.character && (
                          <p className="text-[11px] text-white/30 line-clamp-1 mt-0.5 font-medium">{actor.character}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Related / Phim Hot Rần Rần ── */}
            {related.length > 0 && (
              <section className="mt-12">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-white/90">Phim Hot Rần Rần</h3>
                  <Link href={`/the-loai/${relatedSlug}`} className="text-[12px] text-white/40 hover:text-white transition-colors flex items-center gap-1 group">
                    Xem toàn bộ <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {related.map((m: any) => (
                    <Link key={m.slug} href={`/movie/${m.slug}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 group-hover:-translate-y-1 transition-transform duration-300">
                        <img
                          src={m.poster_url?.startsWith("http") ? m.poster_url : `https://phimimg.com/${m.poster_url}`}
                          alt={m.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {m.episode_current && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary/90 text-[10px] font-semibold text-white">
                            {m.episode_current}
                          </div>
                        )}
                      </div>
                      <div className="px-0.5">
                        <p className="text-[13px] font-semibold text-white/80 group-hover:text-white line-clamp-1 transition-colors">{m.name}</p>
                        <p className="text-[11px] text-white/30 line-clamp-1">{m.origin_name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
