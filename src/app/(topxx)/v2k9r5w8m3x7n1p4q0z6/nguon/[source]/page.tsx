import { getTopXXMovies } from "@/services/api/topxx";
import { getAVDBMovies } from "@/services/api/avdb";
import { notFound } from "next/navigation";
import { XXMovieRow } from "@/components/movie/XXMovieRow";
import { XXHeroSection } from "@/components/movie/XXHeroSection";

export const dynamic = "force-dynamic";

export default async function XXSourcePage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ source: string }>,
    searchParams: Promise<{ page?: string }>
}) {
    const { source } = await params;
    const { page } = await searchParams;
    const currentPage = parseInt(page || "1");

    let data;
    if (source === "topxx") {
        data = await getTopXXMovies(currentPage);
    } else if (source === "avdb") {
        data = await getAVDBMovies(currentPage);
    } else {
        return notFound();
    }

    const sourceName = source === "topxx" ? "TopXX VIP Server" : "AVDB Premium Server";

    return (
        <div className="space-y-16 animate-in fade-in duration-1000">
            {/* Hero for the source */}
            {data.items.length > 0 && (
                <XXHeroSection movie={data.items[0]} />
            )}

            <div className="container mx-auto px-4 lg:px-12 pb-20 space-y-20">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.8] select-none">
                        Nguồn: {sourceName}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest">SERVER DIRECT</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">{data.pagination.totalItems} MOVIES AVAILABLE</span>
                    </div>
                </div>

                {/* Movie Grid for this source */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
                    {data.items.map((movie) => (
                        <div key={movie.id} className="group flex flex-col gap-4">
                             <div className="relative aspect-[2/3] rounded-[30px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-yellow-500/30 group-hover:-translate-y-3">
                                <img 
                                  src={movie.posterUrl} 
                                  alt={movie.title} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                <a href={`/v2k9r5w8m3x7n1p4q0z6/movie/${movie.slug}`} className="absolute inset-0" />
                             </div>
                             <div className="px-1 space-y-1">
                                <h3 className="text-sm font-black text-white group-hover:text-yellow-500 transition-colors line-clamp-2 uppercase leading-tight tracking-tight">{movie.title}</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{movie.year} • {movie.quality}</p>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Simple Pagination */}
                <div className="flex items-center justify-center gap-4 py-10">
                    {currentPage > 1 && (
                        <a 
                           href={`/v2k9r5w8m3x7n1p4q0z6/nguon/${source}?page=${currentPage - 1}`}
                           className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
                        >
                           Trang trước
                        </a>
                    )}
                    <span className="text-white font-black text-sm uppercase italic tracking-tighter">Trang {currentPage} / {data.pagination.totalPages}</span>
                    {currentPage < data.pagination.totalPages && (
                         <a 
                            href={`/v2k9r5w8m3x7n1p4q0z6/nguon/${source}?page=${currentPage + 1}`}
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
                         >
                            Trang sau
                         </a>
                    )}
                </div>
            </div>
        </div>
    );
}
