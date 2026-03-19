import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Star, Clock, CalendarDays, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatchlistBtn } from "@/components/movie/WatchlistBtn";

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
  const poster = data.poster_url?.startsWith("http")
    ? data.poster_url
    : `https://img.ophim.live/uploads/movies/${data.poster_url}`;
  const thumb = data.thumb_url?.startsWith("http")
    ? data.thumb_url
    : `https://img.ophim.live/uploads/movies/${data.thumb_url}`;

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

  // Fetch related by first genre - with a safety timeout or better handling
  const relatedSlug = genreTags[0]?.slug;
  const related = relatedSlug ? await fetchRelated(relatedSlug).catch(() => []) : [];

  const isCompleted =
    data.episode_current?.toLowerCase().includes("full") ||
    data.episode_current?.toLowerCase().includes("hoàn tất");

  return (
    <div className="min-h-screen">
      {/* ── Backdrop Hero ── */}
      <div className="relative w-full h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={thumb || poster}
          alt={data.name}
          className="w-full h-full object-cover object-top scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* ── Content overlapping hero ── */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10 mt-[-280px] pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-40 md:w-56 flex-shrink-0">
            <img
              src={poster || thumb}
              alt={data.name}
              className="w-full rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] aspect-[2/3] object-cover ring-1 ring-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 flex-1 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {data.quality && (
                <span className="bg-primary text-white text-xs font-black px-2 py-1 rounded uppercase tracking-wider">
                  {data.quality}
                </span>
              )}
              {data.lang && (
                <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                  {data.lang}
                </span>
              )}
              {data.episode_current && (
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    isCompleted
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {data.episode_current}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{data.name}</h1>
            {(data.origin_name || data.original_name) && (
              <h2 className="text-lg text-white/50 font-medium -mt-2">
                {data.origin_name || data.original_name}
              </h2>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
              {data.year && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {data.year}
                </span>
              )}
              {data.time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {data.time}
                </span>
              )}
              {data.view && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {Number(data.view).toLocaleString()} lượt xem
                </span>
              )}
            </div>

            {/* Genre tags */}
            {genreTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genreTags.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/the-loai/${g.slug}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-white/8 hover:bg-primary/30 border border-white/10 hover:border-primary/40 text-white/70 hover:text-white transition-all"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            <div
              className="text-neutral-300 leading-relaxed text-sm max-w-2xl line-clamp-4 prose prose-invert"
              dangerouslySetInnerHTML={{ __html: data.content || data.description || "Chưa có nội dung." }}
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-2">
              {firstEp ? (
                <Link href={`/watch/${source}/${slug}/${firstEp.slug || firstEp.name}`}>
                  <Button size="lg" className="rounded-lg px-7 gap-2 font-bold">
                    <Play className="w-5 h-5 fill-current" />
                    Xem Phim
                  </Button>
                </Link>
              ) : (
                <Button size="lg" disabled className="rounded-lg px-7">
                  Sắp chiếu
                </Button>
              )}
              <WatchlistBtn
                movieSlug={data.slug}
                movieTitle={data.name}
                posterUrl={poster || thumb}
              />
            </div>
          </div>
        </div>

        {/* ── Episode List (Multi-server tabs) ── */}
        {allServers.length > 0 && allServers[0].items.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-black mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Danh Sách Tập
            </h3>

            {allServers.map((server, sIdx) => (
              <div key={sIdx} className="mb-6">
                {allServers.length > 1 && (
                  <p className="text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                    {server.name}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap max-h-64 overflow-y-auto p-3 bg-white/3 rounded-xl border border-white/5">
                  {server.items.map((ep: any, idx: number) => (
                    <Link key={idx} href={`/watch/${source}/${slug}/${ep.slug || ep.name}`}>
                      <Button variant="secondary" className="min-w-[4rem] h-9 text-sm font-semibold">
                        {ep.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Related Movies ── */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full" />
                Phim Liên Quan
              </h3>
              {relatedSlug && (
                <Link
                  href={`/the-loai/${relatedSlug}`}
                  className="flex items-center gap-1 text-sm font-semibold text-white/40 hover:text-primary transition-colors"
                >
                  Xem thêm <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
              {related.map((m: any) => {
                const mPoster = m.poster_url?.startsWith("http")
                  ? m.poster_url
                  : `https://phimimg.com/${m.poster_url}`;
                return (
                  <Link key={m.slug} href={`/movie/${m.slug}`} className="group flex flex-col gap-2">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 group-hover:-translate-y-1.5 transition-transform duration-300">
                      <img
                        src={mPoster}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {m.quality && (
                        <span className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                          {m.quality}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white/80 group-hover:text-white line-clamp-1 px-0.5 transition-colors">
                      {m.name}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
