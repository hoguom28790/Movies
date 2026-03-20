import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Star, Clock, CalendarDays, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";
import { getTMDBImageUrl, getTMDBMovieDetails, searchTMDBMovie } from "@/services/tmdb";
import { ActorGallery } from "@/components/movie/ActorGallery";
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
  
  // TMDB Enrichment
  let tmdbSearch = await searchTMDBMovie(data.name, data.year);
  
  // Fallback to origin name if no results found
  if (!tmdbSearch && (data.origin_name || data.original_name)) {
    tmdbSearch = await searchTMDBMovie(data.origin_name || data.original_name, data.year);
  }

  // Final fallback: search without year if still no results
  if (!tmdbSearch) {
    tmdbSearch = await searchTMDBMovie(data.name);
  }
  if (!tmdbSearch && (data.origin_name || data.original_name)) {
    tmdbSearch = await searchTMDBMovie(data.origin_name || data.original_name);
  }
  
  const tmdbData = tmdbSearch ? await getTMDBMovieDetails(tmdbSearch.id) : null;
  const imdbId = tmdbData?.external_ids?.imdb_id;
  
  // Fetch real IMDb rating from imdbapi.dev
  const { getIMDbRating } = await import("@/services/imdb");
  const { getRTRating } = await import("@/services/rottenTomatoes");
  
  const [realImdbRating, rtData] = await Promise.all([
    imdbId ? getIMDbRating(imdbId) : Promise.resolve(null),
    imdbId ? getRTRating(imdbId) : Promise.resolve(null)
  ]);
  
  // Use TMDB Poster with fallback
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

  // Fallbacks from API data
  const fallbackActors = data.actor || [];
  const fallbackDirector = data.director?.[0] || data.director || "Đang cập nhật";
  const directorName = tmdbDirector || fallbackDirector;

  // All servers
  const allServers: { name: string; items: any[] }[] = episodes.map((srv: any, idx: number) => ({
    name: srv.server_name || srv.name || `Server ${idx + 1}`,
    items: srv.server_data || srv.items || [],
  }));

  const defaultServer = allServers[0]?.items || [];
  const firstEp = defaultServer[0];

  // Genre tags
  const genreTags: { name: string; slug: string }[] = (data.category || data.genres || []).map((g: any) =>
    typeof g === "string" ? { name: g, slug: g } : { name: g.name || g, slug: g.slug || g.name || g }
  );

  const relatedSlug = genreTags[0]?.slug;
  const related = relatedSlug ? await fetchRelated(relatedSlug).catch(() => []) : [];

  const isCompleted =
    data.episode_current?.toLowerCase().includes("full") ||
    data.episode_current?.toLowerCase().includes("hoàn tất");

  return (
    <div className="min-h-screen">
      {/* ── Backdrop Hero ── */}
      <div className="relative w-full h-[55vh] min-h-[380px] overflow-hidden">
        <img
          src={thumb || poster}
          alt={data.name}
          className="w-full h-full object-cover object-top opacity-40 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10 -mt-80 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-48 md:w-64 flex-shrink-0">
            <img
              src={poster}
              alt={data.name}
              className="w-full rounded-3xl shadow-2xl aspect-[2/3] object-cover ring-1 ring-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5 flex-1 pt-6 text-center md:text-left items-center md:items-start">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
              <MovieRatings 
                tmdbRating={tmdbData?.vote_average} 
                imdbId={tmdbData?.external_ids?.imdb_id} 
                imdbRating={realImdbRating}
                rottenRating={rtData?.criticScore}
                audienceScore={rtData?.audienceScore}
              />
              <div className="flex items-center gap-2 ml-2">
                <span className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {data.quality || "HD"}
                </span>
                <span className="bg-white/10 text-white/50 text-xs font-bold px-3 py-1.5 rounded-full border border-white/5">
                  {data.lang}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{tmdbData?.title || data.name}</h1>
            <p className="text-sm text-white/40 -mt-2">
              {tmdbData?.original_title || data.origin_name || data.original_name}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[12px] text-white/40">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-white/30" />
                {tmdbData?.release_date?.split("-")[0] || data.year}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                {data.time || "Đang cập nhật"}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-white/30" />
                {Number(data.view || 0).toLocaleString()} views
              </span>
            </div>

            {/* Director & Actors text fallback if needed */}
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-white/60">
                <span className="text-primary font-bold uppercase tracking-wider mr-2">Đạo diễn:</span>
                <span className="text-white font-medium">{directorName}</span>
              </p>
              {tmdbCredits.length === 0 && fallbackActors.length > 0 && (
                <p className="text-white/60">
                  <span className="text-primary font-bold uppercase tracking-wider mr-2">Diễn viên:</span>
                  <span className="text-white font-medium italic">{fallbackActors.join(", ")}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div
              className="text-neutral-300 leading-relaxed text-base max-w-3xl line-clamp-6 md:line-clamp-none prose prose-invert opacity-80"
              dangerouslySetInnerHTML={{ __html: tmdbData?.overview || data.description || data.content || "Đang cập nhật nội dung..." }}
            />

            {/* Genre tags */}
            {genreTags.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {genreTags.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/the-loai/${g.slug}`}
                    className="px-3 py-1.5 rounded-lg text-[12px] bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              {firstEp ? (
                <Link href={`/watch/${source}/${slug}/${firstEp.slug || firstEp.name}`}>
                  <Button size="lg" className="rounded-lg px-8 h-11 gap-2 font-semibold text-[14px] bg-primary hover:bg-primary-hover transition-all hover:scale-[1.03] active:scale-[0.97]">
                    <Play className="w-5 h-5 fill-current" />
                    Xem Ngay
                  </Button>
                </Link>
              ) : (
                <Button size="lg" disabled className="rounded-lg px-8 h-11 bg-white/5 text-white/30">
                  Phim Sắp Chiếu
                </Button>
              )}
              <WatchlistBtn
                movieSlug={data.slug}
                movieTitle={data.name}
                posterUrl={poster}
              />
            </div>
          </div>
        </div>

        {/* ── Actor Gallery ── */}
        <ActorGallery actors={tmdbCredits} />

        {/* ── Episode List ── */}
        {allServers.length > 0 && allServers[0].items.length > 0 && (
          <section className="mt-16">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Tập Phim
            </h3>
            {allServers.map((server, sIdx) => (
              <div key={sIdx} className="mb-8">
                {allServers.length > 1 && (
                  <p className="text-[11px] font-black text-white/30 mb-4 uppercase tracking-[0.2em]">
                    Hệ thống: {server.name}
                  </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  {server.items.map((ep: any, idx: number) => (
                    <Link key={idx} href={`/watch/${source}/${slug}/${ep.slug || ep.name}`}>
                      <Button 
                        variant="secondary" 
                        className="px-6 h-10 rounded-full text-[13px] font-black bg-white/5 border border-white/5 hover:bg-primary hover:text-white hover:border-primary transition-all uppercase tracking-wider"
                      >
                        {ep.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Related ── */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full" />
                Cùng Thể Loại
              </h3>
              <Link href={`/the-loai/${relatedSlug}`} className="text-sm font-bold text-primary/60 hover:text-primary transition-colors flex items-center gap-1 group">
                Xem thêm <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {related.map((m: any) => (
                <Link key={m.slug} href={`/movie/${m.slug}`} className="group space-y-3">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 group-hover:-translate-y-2 transition-transform duration-300 shadow-lg group-hover:shadow-primary/10">
                    <img
                      src={m.poster_url?.startsWith("http") ? m.poster_url : `https://phimimg.com/${m.poster_url}`}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm font-bold text-white/70 group-hover:text-white transition-colors line-clamp-1">{m.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
