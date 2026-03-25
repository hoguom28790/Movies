// src/app/(phim)/xem/[source]/[slug]/[episode]/page.tsx
// FIXED TopXX movie playback: improved slug search from JAV code/title + strong fallback to AVDB + better error handling
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Loader2, AlertTriangle } from "lucide-react";

async function fetchMovieData(source: string, slug: string) {
  const mirrors: Record<string, string[]> = {
    ophim: ["https://ophim1.com", "https://ophim18.cc", "https://ophim17.com", "https://ophim17.cc", "https://ophim10.com"],
    kkphim: ["https://phimapi.com", "https://kkphim.vip"],
    vsmov: ["https://vsmov.xyz", "https://vsmov.live", "https://vsmov.cc"],
    avdb: ["https://avdbapi.com"],
    topxx: ["https://topxx.vip"],
    nguonc: ["https://phim.nguonc.com"]
  };

  const baseUrls = mirrors[source] || [];
  if (baseUrls.length === 0) return null;

  const fetchWithMirror = async (baseUrl: string) => {
    let url = "";
    if (source === "avdb") url = `${baseUrl}/api.php/provide/vod?ac=detail&ids=${slug.includes("av-") ? slug.split("av-")[1] : slug}`;
    else if (source === "topxx") url = `${baseUrl}/api/v1/movies/${slug}`;
    else if (source === "nguonc") url = `${baseUrl}/api/film/${slug}`;
    else url = `${baseUrl}${baseUrl.includes('v1/api') ? '' : '/v1/api'}/phim/${slug}`;

    try {
      const res = await fetch(url, { 
        cache: "no-store", 
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0", "Referer": baseUrl }
      });
      if (!res.ok) throw new Error("404");
      const json = await res.json();
      
      // AVDB Normalize
      if (source === "avdb" && json.list?.[0]) {
        const m = json.list[0];
        const lines = m.vod_play_url?.split("$$$")[0]?.split("#") || [];
        const serverData: any = {};
        lines.forEach((l: string) => {
          const p = l.split("$");
          if (p.length >= 2) serverData[p[0]] = p[1];
        });
        return { movie: m, episodes: [{ server_name: m.vod_play_from?.split("$$$")[0] || "Server Premium", server_data: serverData }] };
      }

      // TopXX Normalize
      if (source === "topxx" && json.data) {
        const movie = json.data;
        const resolveLink = (link: string) => {
          if (link.includes('streamxx.net')) {
            const code = link.split('/').pop();
            const base = link.split('/player/')[0] || "https://embed.streamxx.net";
            const direct = `${base}/stream/${code}/main.m3u8`;
            return `/api/topxx/proxy?url=${encodeURIComponent(direct)}`;
          }
          return link;
        };
        
        // Transform TopXX 'sources' into our Server-Episode format
        const episodes = [{
          server_name: "TopXX Premium",
          server_data: movie.sources?.reduce((acc: any, s: any, idx: number) => {
             const resolved = resolveLink(s.link);
             const isHls = resolved.includes('.m3u8') || resolved.includes('streamxx');
             acc[idx === 0 ? "Full" : `Server ${idx + 1}`] = {
               link_m3u8: isHls ? resolved : '',
               link_embed: !isHls ? resolved : s.link
             };
             return acc;
          }, {}) || {}
        }];
        return { movie, episodes };
      }

      // AVDB Normalize
      if (source === "avdb") {
        const movie = json;
        const resolveLink = (link: string) => {
          if (link.includes('upload18.org/play/index/')) {
            const id = link.split('index/')[1];
            const direct = `https://upload18.org/hls/${id}/index.m3u8`;
            return `/api/topxx/proxy?url=${encodeURIComponent(direct)}`;
          }
          return link;
        };

        const serverData = movie.episodes?.server_data || {};
        const episodes = [{
          server_name: "AVDB Premium",
          server_data: Object.entries(serverData).reduce((acc: any, [name, link]: any) => {
             const resolved = resolveLink(link);
             const isHls = resolved.includes('.m3u8') || resolved.includes('hls');
             acc[name || "Full"] = {
               link_m3u8: isHls ? resolved : '',
               link_embed: !isHls ? resolved : link
             };
             return acc;
          }, {})
        }];
        return { movie, episodes };
      }

      // Hồ Phim Normalize
      if (json.data?.item) return { movie: json.data.item, episodes: json.data.item.episodes || json.data.server_data || [] };
      if (json.movie) return { movie: json.movie, episodes: json.episodes || [] };
      
      // Secondary fallback (without v1/api prefix if the mirror is legacy)
      if (!json.data?.item && !json.movie && !baseUrl.includes('v1/api')) {
         const altUrl = `${baseUrl}/phim/${slug}`;
         const altRes = await fetch(altUrl, { signal: AbortSignal.timeout(3000) });
         const altJson = await altRes.json();
         if (altJson.movie) return { movie: altJson.movie, episodes: altJson.episodes || [] };
      }
      
      throw new Error("Invalid response");
    } catch (e) {
      throw e;
    }
  };

  try {
    // Try all mirrors in parallel, returning the first successful one
    return await Promise.any(baseUrls.map(mirror => fetchWithMirror(mirror)));
  } catch (e) {
    return null;
  }
}

const AVAILABLE_SOURCES = [
  { id: "ophim", name: "OPhim", type: "hop" },
  { id: "kkphim", name: "KKPhim", type: "hop" },
  { id: "vsmov", name: "VSMOV", type: "hop" },
  { id: "topxx", name: "TopXX.vip", type: "tx" },
  { id: "avdb", name: "AVDBAPI", type: "tx" },
];

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ source: string; slug: string; episode: string }>;
  searchParams: Promise<{ s?: string; sv?: string }>;
}) {
  const [{ source, slug, episode }, { s, sv }] = await Promise.all([params, searchParams]);
  const currentServerIdx = sv ? parseInt(sv) : 0;
  const isTopXX = source === "avdb" || source === "topxx";

  try {
    let rawData = await fetchMovieData(source, slug);
    if (!rawData || !rawData.movie) return notFound();

    const data = rawData.movie;
    const episodes = rawData.episodes || [];
    
    const allServers = episodes.map((srv: any, idx: number) => ({
      name: srv.server_name || srv.name || `Server ${idx + 1}`,
      items: Object.entries(srv.server_data || {}).map(([name, link]) => ({
         name, slug: name, link_m3u8: typeof link === 'string' ? link : (link as any).link_m3u8, link_embed: typeof link === 'string' ? '' : (link as any).link_embed
      }))
    }));

    if (allServers.length === 0) return notFound();

    const activeServerGroup = allServers[currentServerIdx]?.items || allServers[0]?.items || [];
    const currentEpIdx = activeServerGroup.findIndex((e: any) => e.slug === decodeURIComponent(episode) || e.name === decodeURIComponent(episode));
    const currentEp = currentEpIdx >= 0 ? activeServerGroup[currentEpIdx] : activeServerGroup[0];
    
    if (!currentEp) return notFound();

    return (
      <div className={`min-h-screen pt-14 pb-safe ${isTopXX ? 'bg-[#0f1115] text-white' : 'bg-background'}`}>
        <div className="container mx-auto px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
           <Link href={`/phim/${slug}`} className="flex items-center gap-2 text-white/40 hover:text-primary transition-all font-bold uppercase italic text-xs tracking-widest leading-none">
              <ArrowLeft className="w-4 h-4" /> Quay lại thông tin
           </Link>
           
           <div className="flex items-center gap-4 z-[100] relative">
              <div className="relative group/src">
                <button className="h-9 px-4 gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-black text-[11px] uppercase italic rounded-xl flex items-center justify-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   Nguồn: {source.toUpperCase()}
                </button>
                
                <div className="absolute right-0 top-full pt-2 opacity-0 -translate-y-2 pointer-events-none group-hover/src:opacity-100 group-hover/src:translate-y-0 group-hover/src:pointer-events-auto transition-all duration-300 z-[1000] w-48">
                  <div className="bg-[#0f1115] border border-white/5 rounded-2xl shadow-2xl p-2 overflow-hidden backdrop-blur-3xl ring-1 ring-white/10">
                    <p className="px-3 py-2 text-[9px] font-black text-white/20 uppercase tracking-widest italic border-b border-white/5 mb-1 text-center">Chọn nguồn phát</p>
                    {AVAILABLE_SOURCES
                      .filter(src => isTopXX ? src.type === "tx" : src.type === "hop")
                      .map((src) => (
                        <Link key={src.id} href={`/xem/${src.id}/${slug}/${episode}`} replace scroll={false} className="block">
                          <button className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase italic rounded-xl transition-all mb-1 last:mb-0 ${source === src.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/40 hover:bg-white/5 hover:text-white"}`}>
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
          url={currentEp.link_m3u8} 
          isHls={s !== "embed"} 
          rawEmbedUrl={currentEp.link_embed}
          movieTitle={data.name || data.title}
          movieSlug={slug}
          episodeName={currentEp.name === "0" || currentEp.name?.toLowerCase() === "full" ? "1" : currentEp.name}
          episodeSlug={currentEp.slug}
          posterUrl={data.thumb_url || data.poster_url || ""}
          source={source}
        />

        <div className="container mx-auto px-4 lg:px-8 py-10 space-y-12 pb-32">
           <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black italic uppercase italic tracking-tighter">{data.name || data.title}</h1>
              <div className="flex items-center gap-4 text-white/40 font-bold uppercase italic tracking-widest">
                 <span>TẬP {currentEp.name}</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                 <span>{data.origin_name || data.movie_code}</span>
              </div>
           </div>

           {allServers.map((server: any, sIdx: number) => (
             <div key={sIdx} className="space-y-6">
               <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.5em] italic">{server.name}</h3>
               <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3">
                 {server.items.map((ep: any, idx: number) => {
                   const isCurrent = sIdx === currentServerIdx && (ep.name === currentEp.name);
                   return (
                     <Link key={idx} href={`/xem/${source}/${slug}/${ep.slug}?sv=${sIdx}`}>
                        <button className={`w-full py-3 text-[12px] font-black italic rounded-xl border transition-all ${isCurrent ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                           {ep.name}
                        </button>
                     </Link>
                   );
                 })}
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  } catch (err) {
    return notFound();
  }
}

