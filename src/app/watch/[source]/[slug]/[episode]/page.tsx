import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HistoryTracker } from "@/components/movie/HistoryTracker";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { PlayerContainer } from "@/components/movie/PlayerContainer";

async function fetchMovieData(source: string, slug: string) {
  let url = "";
  if (source === "nguonc") url = `https://phim.nguonc.com/api/film/${slug}`;
  else if (source === "kkphim") url = `https://phimapi.com/phim/${slug}`;
  else if (source === "ophim") url = `https://ophim1.com/phim/${slug}`;
  else return null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === false || json.status === "error") return null;
    return json;
  } catch {
    return null;
  }
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ source: string; slug: string; episode: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { source, slug, episode } = await params;
  const { s } = await searchParams;

  const rawData = await fetchMovieData(source, slug);
  if (!rawData || !rawData.movie) return notFound();

  const data = rawData.movie;
  const episodes = rawData.episodes || rawData.movie.episodes || [];
  const defaultServer = episodes[0]?.server_data || episodes[0]?.items || [];

  const currentEpIdx = defaultServer.findIndex(
    (e: any) => e.slug === episode || e.name === episode
  );
  const currentEp =
    currentEpIdx >= 0 ? defaultServer[currentEpIdx] : defaultServer[0];
  if (!currentEp) return notFound();

  const prevEp = currentEpIdx > 0 ? defaultServer[currentEpIdx - 1] : null;
  const nextEp = currentEpIdx < defaultServer.length - 1 ? defaultServer[currentEpIdx + 1] : null;

  const rawM3u8Url = currentEp.link_m3u8 || currentEp.m3u8 || "";
  const rawEmbedUrl = currentEp.link_embed || currentEp.embed || "";

  const isHls = s !== "embed";
  const iframeSrc =
    isHls && rawM3u8Url
      ? `/player.html?url=${encodeURIComponent(rawM3u8Url)}`
      : rawEmbedUrl || `/player.html?url=${encodeURIComponent(rawM3u8Url)}`;

  const poster = data.thumb_url || data.poster_url;
  const resolvedPosterUrl = poster?.startsWith("http")
    ? poster
    : `https://img.ophim.live/uploads/movies/${poster}`;

  // All servers for multi-server selector
  const allServers: { name: string; items: any[] }[] = episodes.map((srv: any, idx: number) => ({
    name: srv.server_name || srv.name || `Server ${idx + 1}`,
    items: srv.server_data || srv.items || [],
  }));

  return (
    <div className="min-h-screen bg-black pt-16">
      <HistoryTracker
        movieSlug={slug}
        movieTitle={data.name}
        episodeName={currentEp.name}
        episodeSlug={currentEp.slug || currentEp.name}
        posterUrl={resolvedPosterUrl || ""}
      />

      {/* ── Video Player Container ── */}
      <div className="w-full bg-black">
        {/* Top bar above player */}
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href={`/movie/${slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {data.name}
          </Link>

          {/* Server switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider hidden sm:block">Server:</span>
            {rawEmbedUrl && (
              <Link href={`/watch/${source}/${slug}/${episode}?s=embed`} scroll={false} replace>
                <Button
                  variant={!isHls ? "primary" : "secondary"}
                  size="sm"
                  className="h-7 text-xs px-3"
                >
                  VIP 1
                </Button>
              </Link>
            )}
            {rawM3u8Url && (
              <Link href={`/watch/${source}/${slug}/${episode}?s=hls`} scroll={false} replace>
                <Button
                  variant={isHls ? "primary" : "secondary"}
                  size="sm"
                  className="h-7 text-xs px-3"
                >
                  VIP 2
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Player */}
        <PlayerContainer 
          url={rawM3u8Url} 
          isHls={isHls} 
          rawEmbedUrl={rawEmbedUrl}
        />
      </div>

      {/* ── Info & Controls ── */}
      <div className="container mx-auto px-4 lg:px-8 py-6 flex flex-col gap-8">
        {/* Title + Prev/Next */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {data.name}
              <span className="text-primary ml-2">- Tập {currentEp.name}</span>
            </h1>
            {(data.origin_name || data.original_name) && (
              <p className="text-sm text-white/40 mt-1">{data.origin_name || data.original_name}</p>
            )}
          </div>

          {/* Prev / Next Episode */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {prevEp ? (
              <Link href={`/watch/${source}/${slug}/${prevEp.slug || prevEp.name}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 gap-1.5 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Tập trước
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" size="sm" className="h-9 opacity-40 cursor-not-allowed" disabled>
                <ChevronLeft className="w-4 h-4" /> Tập trước
              </Button>
            )}
            {nextEp ? (
              <Link href={`/watch/${source}/${slug}/${nextEp.slug || nextEp.name}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 gap-1.5 font-semibold"
                >
                  Tập tiếp <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" size="sm" className="h-9 opacity-40 cursor-not-allowed" disabled>
                Tập tiếp <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Episode Selector ── */}
        {allServers.map((server, sIdx) => (
          <section key={sIdx}>
            <h3 className="text-base font-bold mb-3 text-white/50 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              {allServers.length > 1 ? server.name : "Chọn Tập"}
            </h3>
            <div className="flex gap-2 flex-wrap max-h-72 overflow-y-auto p-3 bg-white/3 rounded-xl border border-white/5">
              {server.items.map((ep: any, idx: number) => {
                const epId = ep.slug || ep.name;
                const isCurrent = sIdx === 0 && (ep.slug === episode || ep.name === episode);
                return (
                  <Link key={idx} href={`/watch/${source}/${slug}/${epId}`}>
                    <Button
                      variant={isCurrent ? "primary" : "secondary"}
                      className={`min-w-[3.5rem] h-9 text-sm font-semibold ${isCurrent ? "shadow-[0_0_12px_rgba(229,9,20,0.4)]" : ""}`}
                    >
                      {ep.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
