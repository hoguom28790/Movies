import { getTopXXMovies } from "@/services/api/topxx";
import { getAVDBMovies } from "@/services/api/avdb";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/movie/HeroSection";
import { MovieCard } from "@/components/movie/MovieCard";
import { Movie } from "@/types/movie";
import { TOPXX_PATH } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TopXXSourcePage({ 
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
        data = await getTopXXMovies("phim-moi", "", currentPage);
    } else if (source === "avdb") {
        data = await getAVDBMovies(currentPage);
    } else {
        return notFound();
    }

    const sourceName = source === "topxx" ? "TopXX VIP Server" : "AVDB Premium Server";

    return (
        <div className="space-y-16 animate-in fade-in duration-1000">
            {/* Hero for the source */}
            {data.items.length > 0 && data.items[0] && (
                <HeroSection movie={data.items[0] as unknown as Movie} isXX />
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
                    {(data.items as unknown as Movie[]).map((movie: Movie) => (
                        <MovieCard 
                            key={movie.id}
                            title={movie.title}
                            slug={movie.slug}
                            posterUrl={movie.posterUrl}
                            year={movie.year}
                            quality={movie.quality}
                            isXX
                        />
                    ))}
                </div>

                {/* Simple Pagination */}
                <div className="flex items-center justify-center gap-4 py-10">
                    {currentPage > 1 && (
                        <a 
                           href={`/${TOPXX_PATH}/nguon/${source}?page=${currentPage - 1}`}
                           className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
                        >
                           Trang trước
                        </a>
                    )}
                    <span className="text-white font-black text-sm uppercase italic tracking-tighter">Trang {currentPage} / {data.pagination.totalPages}</span>
                    {currentPage < data.pagination.totalPages && (
                         <a 
                            href={`/${TOPXX_PATH}/nguon/${source}?page=${currentPage + 1}`}
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
