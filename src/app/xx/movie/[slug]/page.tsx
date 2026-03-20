import { getTopXXDetails } from "@/services/api/topxx";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Calendar, Globe, Tag, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function XXMovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // In TopXX, the 'slug' we use in URLs is actually the 'code'
  const item = await getTopXXDetails(slug);

  if (!item) return notFound();

  const viTrans = item.trans?.find((t: any) => t.locale === "vi") || item.trans?.[0];
  const poster = item.thumbnail;
  const thumb = item.thumbnail;

  // TopXX sources are in the 'sources' array
  const mainSource = item.sources?.[0];

  return (
    <div className="container mx-auto pb-20">
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] rounded-3xl overflow-hidden mb-12 group">
        <img src={thumb || poster} alt={viTrans?.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row items-end gap-8">
          <div className="w-44 h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 hidden md:block">
            <img src={poster} alt={viTrans?.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
             <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg tracking-tight uppercase leading-tight">
                {viTrans?.title}
             </h1>
             <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest">
                  <Play className="w-3 h-3 fill-current" />
                  {item.quality}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-semibold">
                  <Calendar className="w-3 h-3" />
                  {item.publish_at ? new Date(item.publish_at).getFullYear() : ""}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-semibold">
                  {item.duration}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Player & Sources */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-inner shadow-black/50">
            {mainSource ? (
              <iframe
                src={mainSource.link}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-4">
                 <Play className="w-16 h-16 opacity-10" />
                 <p className="font-medium">Nội dung đang được chuẩn bị...</p>
              </div>
            )}
          </div>

          {item.sources && item.sources.length > 1 && (
            <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                 SERVER DỰ PHÒNG
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                 {item.sources.map((src: any, idx: number) => (
                   <Link 
                     key={idx} 
                     href={src.link} 
                     target="_self"
                     className={`px-4 py-3 rounded-xl border text-center text-sm font-bold transition-all duration-300 shadow-sm ${idx === 0 ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                   >
                     Server {idx + 1}
                   </Link>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="space-y-8">
          <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 backdrop-blur-md">
             <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4 uppercase tracking-wider text-yellow-500">Thông tin chi tiết</h3>
             <ul className="space-y-5">
               <li className="flex flex-col gap-1.5">
                 <div className="flex items-center gap-2 text-white/30 text-[11px] font-bold uppercase tracking-widest">
                   <Tag className="w-3.5 h-3.5" />
                   Thể loại
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {item.genres?.map((g: any) => (
                     <span key={g.code} className="text-sm font-bold border-b border-white/10 text-white/80 pb-0.5">
                       {g.trans?.find((t: any) => t.locale === "vi")?.name || g.code}
                     </span>
                   ))}
                 </div>
               </li>
               <li className="flex flex-col gap-1.5">
                 <div className="flex items-center gap-2 text-white/30 text-[11px] font-bold uppercase tracking-widest">
                   <Globe className="w-3.5 h-3.5" />
                   Quốc gia
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {item.countries?.map((c: any) => (
                     <span key={c.code} className="text-sm font-bold border-b border-white/10 text-white/80 pb-0.5">
                        {c.trans?.find((t: any) => t.locale === "vi")?.name || c.code}
                     </span>
                   ))}
                 </div>
               </li>
               <li className="flex flex-col gap-1.5">
                 <div className="flex items-center gap-2 text-white/30 text-[11px] font-bold uppercase tracking-widest">
                   <Users className="w-3.5 h-3.5" />
                   Diễn viên
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {item.actors?.map((a: any, idx: number) => (
                     <span key={idx} className="text-sm font-bold border-b border-white/10 text-white/80 pb-0.5">
                        {a.trans?.find((t: any) => t.locale === "vi")?.name || "Actor"}
                     </span>
                   ))}
                 </div>
               </li>
             </ul>

             <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-[12px] font-black text-white/20 mb-3 uppercase tracking-[0.2em]">Nội dung phim</h4>
                <div 
                  className="text-sm text-white/50 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: viTrans?.content || "Đang cập nhật nội dung..." }}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
