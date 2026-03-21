import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, ArrowLeft, Play } from "lucide-react";
import { PlayerContainer } from "@/components/phim/PlayerContainer";

async function fetchMovieData(source: string, slug: string) {
  let url = "";
  if (source === "nguonc") url = `https://phim.nguonc.com/api/film/${slug}`;
  else if (source === "kkphim") url = `https://phimapi.com/phim/${slug}`;
  else if (source === "vsmov") url = `https://vsmov.com/api/phim/${slug}`;
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

// Available streaming proxies globally supported
const AVAILABLE_SOURCES = [
  { id: "ophim", name: "OPhim" },
  { id: "kkphim", name: "KKPhim" },
  { id: "vsmov", name: "VSMOV" },
];

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ source: string; slug: string; episode: string }>;
  searchParams: Promise<{ s?: string; sv?: string }>;
}) {
  const { source, slug, episode } = await params;
  const { s, sv } = await searchParams;
  const currentServerIdx = sv ? parseInt(sv) : 0;
 
  try {
    let rawData = await fetchMovieData(source, slug);
    let activeSource = source;
    let fallbackFlag = false;

    // Automatic Fallback Engine
    if (!rawData || !rawData.movie) {
      const fallbacks = ["ophim", "kkphim", "vsmov"].filter(s => s !== source);
      for (const f of fallbacks) {
        const fbData = await fetchMovieData(f, slug);
        if (fbData && fbData.movie) {
          rawData = fbData;
          activeSource = f;
          fallbackFlag = true;
          break;
        }
      }
      
      // If everything totally fails
      if (!rawData || !rawData.movie) return notFound();
    }
 
    const data = rawData.movie;
    const episodes = Array.isArray(rawData.episodes) ? rawData.episodes : (Array.isArray(rawData.movie.episodes) ? rawData.movie.episodes : []);
    
    // Server normalization
    const allServers: { name: string; items: any[] }[] = episodes.map((srv: any, idx: number) => ({
      name: srv.server_name || srv.name || `Server ${idx + 1}`,
      items: Array.isArray(srv.server_data) ? srv.server_data : (Array.isArray(srv.items) ? srv.items : []),
    }));
 
    if (allServers.length === 0) return notFound();
 
    const activeServerGroup = (allServers[currentServerIdx] || allServers[0])?.items || [];
    const currentEpIdx = activeServerGroup.findIndex(
      (e: any) => e.slug === episode || e.name === episode
    );
    const currentEp =
      currentEpIdx >= 0 ? activeServerGroup[currentEpIdx] : activeServerGroup[0];
    
    if (!currentEp) return notFound();
 
    const prevEp = currentEpIdx > 0 ? activeServerGroup[currentEpIdx - 1] : null;
    const nextEp = currentEpIdx < activeServerGroup.length - 1 ? activeServerGroup[currentEpIdx + 1] : null;
 
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2">
            <Link
              href={`/phim/${slug}`}
              className="flex items-center gap-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors min-w-0"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{data.name}</span>
            </Link>
 
            <div className="flex items-center gap-1.5 flex-shrink-0 relative group">
              {/* Fallback Toast Notification */}
              {fallbackFlag && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-orange-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-orange-500/30 font-bold text-[14px] animate-in slide-in-from-top-4 fade-in duration-300">
                  ⚠️ Nguồn bị lỗi! Đã chuyển sang {activeSource.toUpperCase()}
                </div>
              )}
              
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:block">Nguồn phim:</span>
              
              {/* Source Switcher Dropdown - Fixed hover gap */}
              <div className="relative group cursor-pointer mr-2">
                <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-[11px] px-3 font-semibold rounded-lg shadow-lg bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  {activeSource}
                </Button>
                
                {/* Dropdown Menu with Bridge */}
                <div className="absolute right-0 top-full pt-2 w-36 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[100]">
                  <div className="bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl flex flex-col p-1 overflow-hidden">
                    {AVAILABLE_SOURCES.map((src) => (
                      <Link key={src.id} href={`/xem/${src.id}/${slug}/${episode}`} replace scroll={false}>
                         <button className={`w-full text-left px-3 py-2.5 text-[12px] font-bold rounded-lg transition-colors border-b border-white/5 last:border-none ${activeSource === src.id ? "bg-primary text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                           {src.name}
                         </button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <PlayerContainer 
            url={rawM3u8Url} 
            isHls={isHls} 
            rawEmbedUrl={rawEmbedUrl}
            nextEpisodeUrl={nextEp ? `/xem/${activeSource}/${slug}/${nextEp.slug || nextEp.name}?sv=${currentServerIdx}` : undefined}
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
                <Link href={`/xem/${activeSource}/${slug}/${prevEp.slug || prevEp.name}?sv=${currentServerIdx}`}>
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
                <Link href={`/xem/${activeSource}/${slug}/${nextEp.slug || nextEp.name}?sv=${currentServerIdx}`}>
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
                  const isCurrent = sIdx === currentServerIdx && (ep.slug === episode || ep.name === episode);
                  return (
                    <Link key={idx} href={`/xem/${activeSource}/${slug}/${epId}?sv=${sIdx}`}>
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
        <Link href={`/phim/${slug}`}>
          <Button className="rounded-xl px-8 h-11">
            Quay lại trang thông tin
          </Button>
        </Link>
      </div>
    );
  }
}
