import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Loader2, AlertTriangle } from "lucide-react";

// FIXED Play button position on hover + FIXED VSMOV source switching (with fallback)
async function fetchMovieData(source: string, slug: string) {
  let urls: string[] = [];
  if (source === "nguonc") urls = [`https://phim.nguonc.com/api/film/${slug}`];
  else if (source === "kkphim") {
    urls = [
       `https://phimapi.com/phim/${slug}`,
       `https://phimapi.com/v1/api/phim/${slug}`
    ];
  }
  else if (source === "vsmov") {
    urls = [
      `https://vsmov.xyz/api/phim/${slug}`,
      `https://vsmov.xyz/v1/api/phim/${slug}`,
      `https://vsmov.xyz/api/film/${slug}`,
      `https://vsmov.com/api/phim/${slug}`
    ];
  }
  else if (source === "ophim") {
    urls = [
      `https://ophim1.com/phim/${slug}`,
      `https://ophim1.com/v1/api/phim/${slug}`
    ];
  }
  else return null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json();
      
      // Handle various API formats (standard, v1, old)
      if (json.status === "success" || json.status === true || (json.movie && json.status !== false)) {
         // Normalize v1 data
         if (json.data?.item) {
            return {
               movie: json.data.item,
               episodes: json.data.item.episodes || json.data.server_data || []
            };
         }
         return json;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// Search utility for VSMOV if direct slug fails
async function searchVSMOV(title: string) {
  try {
    const searchUrl = `https://vsmov.xyz/api/phim/search?keyword=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items?.[0]) {
       return await fetchMovieData("vsmov", data.items[0].slug);
    }
  } catch (e) {}
  return null;
}

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

    // Smart Fallback Engine with Search Capabilities
    if (!rawData || !rawData.movie) {
      // If VSMOV fails, try searching it by title from another source first?
      // Since we don't have the title yet, we get it from a reliable source like OPhim
      const refData = (source !== "ophim") ? await fetchMovieData("ophim", slug) : null;
      const title = refData?.movie?.name || slug.replace(/-/g, " ");
      
      if (source === "vsmov") {
         rawData = await searchVSMOV(title);
         if (rawData) activeSource = "vsmov";
      }

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
      }
      
      if (!rawData || !rawData.movie) return notFound();
    }
 
    const data = rawData.movie;
    // Normalize episodes structure
    let episodes = Array.isArray(rawData.episodes) ? rawData.episodes : (Array.isArray(rawData.movie.episodes) ? rawData.movie.episodes : []);
    if (episodes.length === 0 && rawData.data?.item?.server_data) episodes = rawData.data.item.server_data;

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
    const currentEp = currentEpIdx >= 0 ? activeServerGroup[currentEpIdx] : activeServerGroup[0];
    
    if (!currentEp) return notFound();
 
    const nextEp = currentEpIdx < activeServerGroup.length - 1 ? activeServerGroup[currentEpIdx + 1] : null;
    const prevEp = currentEpIdx > 0 ? activeServerGroup[currentEpIdx - 1] : null;

    const rawM3u8Url = currentEp.link_m3u8 || currentEp.m3u8 || "";
    const rawEmbedUrl = currentEp.link_embed || currentEp.embed || "";
    const isHls = s !== "embed";
    
    const poster = data.thumb_url || data.poster_url || "";
    const resolvedPosterUrl = poster?.startsWith("http") ? poster : `https://img.ophim.live/uploads/movies/${poster}`;
 
    return (
      <div className="min-h-screen bg-background pt-14 pb-safe md:pb-0">
        <div className="w-full bg-background pt-safe">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
            <Link href={`/phim/${slug}`} className="flex items-center gap-2 text-[13px] font-bold text-foreground/40 hover:text-primary transition-colors min-w-0">
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{data.name}</span>
            </Link>

            <div className="flex items-center gap-3">
              {fallbackFlag && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg text-[10px] font-black uppercase italic animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Nguồn {source.toUpperCase()} lỗi! Đã chuyển sang {activeSource.toUpperCase()}
                </div>
              )}
              
              <div className="relative group">
                <Button variant="secondary" size="sm" className="h-8 gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-black text-[11px] uppercase italic">
                  <Server className="w-3.5 h-3.5" /> {activeSource}
                </Button>
                <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100] w-40">
                  <div className="bg-[#0f1115] border border-white/5 rounded-2xl shadow-2xl p-1.5 overflow-hidden backdrop-blur-3xl">
                    {AVAILABLE_SOURCES.map((src) => (
                      <Link key={src.id} href={`/xem/${src.id}/${slug}/${episode}`} replace scroll={false}>
                        <button className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase italic rounded-xl transition-all mb-1 last:mb-0 ${activeSource === src.id ? "bg-primary text-white" : "text-white/40 hover:bg-white/5 hover:text-white"}`}>
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

        <div className="container mx-auto px-4 lg:px-8 py-8 flex flex-col gap-10 pb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
               <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                 {data.name}
               </h1>
               <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-primary/20 text-primary text-[11px] font-black uppercase italic rounded-lg border border-primary/20">
                    Tập {currentEp.name}
                  </div>
                  {(data.origin_name || data.original_name) && (
                    <span className="text-[11px] text-white/20 font-black uppercase italic tracking-widest truncate">{data.origin_name || data.original_name}</span>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-3">
              {prevEp && (
                <Link href={`/xem/${activeSource}/${slug}/${prevEp.slug || prevEp.name}?sv=${currentServerIdx}`}>
                  <Button variant="secondary" className="h-12 px-6 rounded-2xl font-black text-[12px] uppercase italic gap-3 bg-white/5 border-white/10 hover:bg-white/10">
                    <ChevronLeft className="w-5 h-5" /> Tập trước
                  </Button>
                </Link>
              )}
              {nextEp && (
                <Link href={`/xem/${activeSource}/${slug}/${nextEp.slug || nextEp.name}?sv=${currentServerIdx}`}>
                  <Button variant="primary" className="h-12 px-8 rounded-2xl font-black text-[12px] uppercase italic gap-3 shadow-lg shadow-primary/20">
                    Tập tiếp <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {allServers.map((server, sIdx) => (
            <section key={sIdx} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] italic">
                   {allServers.length > 1 ? server.name : "Chapter Selection"}
                </h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3">
                {server.items.map((ep: any, idx: number) => {
                  const epId = ep.slug || ep.name;
                  const isCurrent = sIdx === currentServerIdx && (ep.slug === episode || ep.name === episode);
                  return (
                    <Link key={idx} href={`/xem/${activeSource}/${slug}/${epId}?sv=${sIdx}`}>
                      <button className={`w-full py-3 text-[12px] font-black italic rounded-xl transition-all border ${isCurrent ? "bg-primary text-white border-primary shadow-lg shadow-primary/30" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white hover:bg-white/10"}`}>
                        {ep.name}
                      </button>
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
    return notFound();
  }
}

function Server({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  );
}
