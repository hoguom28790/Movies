import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, ArrowLeft, Play } from "lucide-react";
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
 
  try {
    const rawData = await fetchMovieData(source, slug);
    if (!rawData || !rawData.movie) return notFound();
 
    const data = rawData.movie;
    const episodes = Array.isArray(rawData.episodes) ? rawData.episodes : (Array.isArray(rawData.movie.episodes) ? rawData.movie.episodes : []);
    
    // Server normalization
    const allServers: { name: string; items: any[] }[] = episodes.map((srv: any, idx: number) => ({
      name: srv.server_name || srv.name || `Server ${idx + 1}`,
      items: Array.isArray(srv.server_data) ? srv.server_data : (Array.isArray(srv.items) ? srv.items : []),
    }));
 
    if (allServers.length === 0) return notFound();
 
    const defaultServer = allServers[0]?.items || [];
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
    
    const poster = data.thumb_url || data.poster_url || "";
    const resolvedPosterUrl = poster?.startsWith("http")
      ? poster
      : `https://img.ophim.live/uploads/movies/${poster}`;
 
    return (
      <div className={`min-h-screen bg-black pt-14 pb-safe md:pb-0`}>
        <div className="w-full bg-black pt-safe">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 overflow-hidden">
            <Link
              href={`/movie/${slug}`}
              className="flex items-center gap-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors min-w-0"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{data.name}</span>
            </Link>
 
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:block">Server:</span>
              {rawEmbedUrl && (
                <Link href={`/watch/${source}/${slug}/${episode}?s=embed`} scroll={false} replace>
                  <Button
                    variant={!isHls ? "primary" : "secondary"}
                    size="sm"
                    className={`h-7 sm:h-8 text-[10px] sm:text-[11px] px-3 sm:px-4 rounded-lg font-semibold transition-all ${
                      !isHls ? "shadow-lg shadow-primary/30" : "bg-white/5 border-white/5"
                    }`}
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
                    className={`h-7 sm:h-8 text-[10px] sm:text-[11px] px-3 sm:px-4 rounded-lg font-semibold transition-all ${
                      isHls ? "shadow-lg shadow-primary/30" : "bg-white/5 border-white/5"
                    }`}
                  >
                    VIP 2
                  </Button>
                </Link>
              )}
            </div>
          </div>
 
          <PlayerContainer 
            url={rawM3u8Url} 
            isHls={isHls} 
            rawEmbedUrl={rawEmbedUrl}
            nextEpisodeUrl={nextEp ? `/watch/${source}/${slug}/${nextEp.slug || nextEp.name}` : undefined}
            movieTitle={data.name}
            movieSlug={slug}
            episodeName={currentEp.name}
            episodeSlug={currentEp.slug || currentEp.name}
            posterUrl={resolvedPosterUrl || ""}
          />
        </div>
 
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-5 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white">
                {data.name}
                <span className="text-primary ml-2 text-base sm:text-2xl">- Tập {currentEp.name}</span>
              </h1>
              {(data.origin_name || data.original_name) && (
                <p className="text-sm text-white/40 mt-1">{data.origin_name || data.original_name}</p>
              )}
            </div>
 
            <div className="flex items-center gap-2 flex-shrink-0">
              {prevEp ? (
                <Link href={`/watch/${source}/${slug}/${prevEp.slug || prevEp.name}`}>
                  <Button variant="secondary" size="sm" className="h-9 gap-1.5 font-semibold">
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
                  <Button variant="primary" size="sm" className="h-9 gap-1.5 font-semibold">
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
 
          {allServers.map((server, sIdx) => (
            <section key={sIdx}>
              <h3 className="text-base font-bold mb-3 text-white/50 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                {allServers.length > 1 ? server.name : "Chọn Tập"}
              </h3>
              <div className="flex gap-1.5 flex-wrap max-h-60 overflow-y-auto p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                {server.items.map((ep: any, idx: number) => {
                  const epId = ep.slug || ep.name;
                  const isCurrent = sIdx === 0 && (ep.slug === episode || ep.name === episode);
                  return (
                    <Link key={idx} href={`/watch/${source}/${slug}/${epId}`}>
                      <Button
                        variant={isCurrent ? "primary" : "secondary"}
                        className={`min-w-[3.5rem] px-3 sm:px-4 h-8 sm:h-9 text-[11px] sm:text-[12px] font-semibold rounded-lg transition-all ${
                          isCurrent ? "shadow-lg shadow-primary/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
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
  } catch (error) {
    console.error("WatchPage Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-black">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Play className="w-8 h-8 text-red-500 rotate-90" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Ối! Có lỗi khi xem phim</h1>
        <p className="text-white/40 text-sm max-w-xs mb-8">
          Chúng mình không thể tải trình phát tập phim này. Vui lòng thử lại sau hoặc chọn tập khác nhé!
        </p>
        <Link href={`/movie/${slug}`}>
          <Button className="rounded-xl px-8 h-11">
            Quay lại trang thông tin
          </Button>
        </Link>
      </div>
    );
  }
}
