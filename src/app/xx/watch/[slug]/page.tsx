import { getTopXXDetails } from "@/services/api/topxx";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { XXPlayer } from "@/components/layout/XXPlayer";

export const dynamic = "force-dynamic";

export default async function XXWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { slug } = await params;
  const { s } = await searchParams; // s can be 'hls' or 'embed' or index
  
  const item = await getTopXXDetails(slug);
  if (!item) return notFound();

  const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
  const sources = item.sources || [];
  
  if (sources.length === 0) return notFound();

  // Handle server selection
  // In TopXX, sources are just a flat list. We'll treat them as "Servers".
  const currentIdx = s ? parseInt(s) : 0;
  const currentSource = sources[currentIdx] || sources[0];

  const prevSourceIdx = currentIdx > 0 ? currentIdx - 1 : null;
  const nextSourceIdx = currentIdx < sources.length - 1 ? currentIdx + 1 : null;

  return (
    <div className="min-h-screen bg-black pt-14 pb-safe">
      <div className="w-full bg-black pt-safe">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            href={`/xx/movie/${slug}`}
            className="flex items-center gap-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors truncate"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{viTrans?.title}</span>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest hidden sm:block">Server:</span>
            {sources.map((src: any, idx: number) => (
              <Link key={idx} href={`/xx/watch/${slug}?s=${idx}`} scroll={false} replace>
                <Button
                  variant={currentIdx === idx ? "primary" : "secondary"}
                  size="sm"
                  className={`h-8 text-[11px] px-4 rounded-lg font-bold transition-all ${
                    currentIdx === idx ? "shadow-lg shadow-yellow-500/20" : "bg-white/5 border-white/5"
                  }`}
                >
                  SV {idx + 1}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-0 sm:px-4 lg:px-8">
           <XXPlayer 
              url={currentSource.link}
              isHls={currentSource.link.includes('.m3u8')}
              rawEmbedUrl={!currentSource.link.includes('.m3u8') ? currentSource.link : ""}
              movieTitle={viTrans?.title}
              movieCode={item.code}
              posterUrl={item.thumbnail}
           />
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  {viTrans?.title} 
                  <span className="text-yellow-500 ml-3">- Server {currentIdx + 1}</span>
               </h1>
               <div className="flex items-center gap-4 mt-2">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-bold uppercase">{item.quality}</span>
                  <span className="text-white/40 text-sm font-medium">{item.duration}</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
               {prevSourceIdx !== null ? (
                 <Link href={`/xx/watch/${slug}?s=${prevSourceIdx}`}>
                   <Button variant="secondary" className="h-10 gap-2 font-bold px-5 rounded-xl border-white/10">
                     <ChevronLeft className="w-4 h-4" /> Server Trước
                   </Button>
                 </Link>
               ) : (
                 <Button variant="secondary" className="h-10 gap-2 font-bold px-5 rounded-xl opacity-20 cursor-not-allowed border-white/10" disabled>
                   <ChevronLeft className="w-4 h-4" /> Server Trước
                 </Button>
               )}
               
               {nextSourceIdx !== null ? (
                 <Link href={`/xx/watch/${slug}?s=${nextSourceIdx}`}>
                   <Button variant="primary" className="h-10 gap-2 font-bold px-5 rounded-xl">
                     Server Tiếp <ChevronRight className="w-4 h-4" />
                   </Button>
                 </Link>
               ) : (
                 <Button variant="secondary" className="h-10 gap-2 font-bold px-5 rounded-xl opacity-20 cursor-not-allowed border-white/10" disabled>
                   Server Tiếp <ChevronRight className="w-4 h-4" />
                 </Button>
               )}
            </div>
         </div>

         {/* Recommendation / Content Section */}
         <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-sm font-black text-white/20 uppercase tracking-[0.2em] mb-4">Mô tả nội dung</h3>
            <div 
              className="text-white/60 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: viTrans?.content || "Không có mô tả..." }}
            />
         </div>
      </div>
    </div>
  );
}
