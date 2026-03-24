// src/app/(phim)/xem/[source]/[slug]/[episode]/page.tsx
// FIXED TopXX movie playback: improved slug search from JAV code/title + strong fallback to AVDB + better error handling
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PlayerContainer } from "@/components/movie/PlayerContainer";
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Loader2, AlertTriangle } from "lucide-react";

async function fetchMovieData(source: string, slug: string) {
  let urls: string[] = [];
  
  if (source === "avdb") {
    const id = slug.includes("av-") ? slug.split("av-")[1] : slug;
    urls = [`https://avdbapi.com/api.php/provide/vod?ac=detail&ids=${id}`];
  } else if (source === "topxx") {
    urls = [`https://topxx.vip/api/v1/movies/${slug}`];
  } else if (source === "kkphim") {
    urls = [`https://phimapi.com/v1/api/phim/${slug}`, `https://phimapi.com/phim/${slug}`];
  } else if (source === "ophim") {
    urls = [`https://ophim1.com/v1/api/phim/${slug}`, `https://ophim1.com/phim/${slug}`];
  } else if (source === "vsmov") {
    urls = [`https://vsmov.xyz/v1/api/phim/${slug}`, `https://vsmov.xyz/api/phim/${slug}`];
  } else if (source === "nguonc") {
    urls = [`https://phim.nguonc.com/api/film/${slug}`];
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json();
      
      // AVDB Normalize
      if (source === "avdb" && json.list?.[0]) {
        const m = json.list[0];
        let eps: any[] = [];
        if (m.vod_play_url) {
           const lines = m.vod_play_url.split("$$$")[0]?.split("#") || [];
           const serverData: any = {};
           lines.forEach((l: string) => {
              const p = l.split("$");
              if (p.length >= 2) serverData[p[0]] = p[1];
           });
           eps = [{ server_name: m.vod_play_from?.split("$$$")[0] || "Server Premium", server_data: serverData }];
        }
        return { movie: m, episodes: eps };
      }

      // TopXX Normalize
      if (source === "topxx" && json.data) {
        return { movie: json.data, episodes: json.data.episodes || [] };
      }

      // Hồ Phim Normalize
      if (json.data?.item) return { movie: json.data.item, episodes: json.data.item.episodes || json.data.server_data || [] };
      if (json.movie) return { movie: json.movie, episodes: json.episodes || [] };
    } catch (e) {}
  }
  return null;
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
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
           <Link href={`/phim/${slug}`} className="flex items-center gap-2 text-white/40 hover:text-primary"><ArrowLeft className="w-4 h-4" /> Quay lại</Link>
           <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-xl font-bold uppercase italic border border-primary/20">{source}</div>
        </div>

        <PlayerContainer 
          url={currentEp.link_m3u8} 
          isHls={s !== "embed"} 
          rawEmbedUrl={currentEp.link_embed}
          movieTitle={data.name || data.title}
          movieSlug={slug}
          episodeName={currentEp.name}
          posterUrl={data.thumb_url || data.poster_url || ""}
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

