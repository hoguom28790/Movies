import React from "react";
import Link from "next/link";
import { Search, User2, Star } from "lucide-react";

const BASE_URL = "https://topxx.vip/api/v1";

async function getActors(page = 1) {
    try {
        const res = await fetch(`${BASE_URL}/meta/actors?page=${page}`, { next: { revalidate: 3600 } });
        return await res.json();
    } catch (e) {
        return { items: [] };
    }
}

export default async function XXActorsPage() {
    const data = await getActors(1);
    const actors = data.items || [];

    return (
        <div className="container mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.8] select-none">Diễn Viên</h1>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest">STAR DIRECTORY</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic">{actors.length} STARS AVAILABLE</span>
                    </div>
                </div>

                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-yellow-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm diễn viên..." 
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[30px] pl-14 pr-8 py-5 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/[0.06] transition-all font-bold tracking-tight shadow-inner"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
                {actors.map((actor: any) => (
                    <Link 
                        key={actor.slug} 
                        href={`/xx/dien-vien/${actor.slug}`}
                        className="group flex flex-col items-center gap-5 text-center"
                    >
                        <div className="relative w-full aspect-square rounded-[50px] overflow-hidden border-2 border-white/5 shadow-2xl transition-all duration-700 group-hover:border-yellow-500/30 group-hover:-translate-y-4 group-hover:rotate-3">
                           {actor.avatar ? (
                               <img 
                                 src={actor.avatar} 
                                 alt={actor.name} 
                                 className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
                               />
                           ) : (
                               <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                  <User2 className="w-12 h-12 text-white/10" />
                               </div>
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <div className="absolute bottom-4 left-0 right-0 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">View Profile</span>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-sm md:text-base font-black text-white/80 group-hover:text-yellow-500 transition-colors uppercase italic tracking-tighter leading-tight">{actor.name}</h3>
                           <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">{actor.movieCount || 0} PHIM</p>
                        </div>
                    </Link>
                ))}
            </div>

            <style jsx global>{`
                .bg-surface { background-color: #0d0d0d; }
            `}</style>
        </div>
    );
}
