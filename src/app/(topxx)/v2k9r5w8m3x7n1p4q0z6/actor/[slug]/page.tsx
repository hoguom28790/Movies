import { notFound } from "next/navigation";
import Link from "next/link";
import { Film, User, Star, MapPin, CalendarDays, TrendingUp } from "lucide-react";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { FavoriteActorBtn } from "@/components/movie/FavoriteActorBtn";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { TOPXX_PATH } from "@/lib/constants";

export default async function TopXXActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getTMDBActorDetails(parseInt(slug, 10));

  if (!actor || actor.success === false) return notFound();

  const profileImg = getTMDBImageUrl(actor.profile_path, 'w500');
  const movies = (actor.movie_credits?.cast || [])
    .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 30);

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-500 theme-xx">
      {/* ── Header Backdrop ── */}
      <div className="relative w-full h-[35vh] sm:h-[45vh] lg:h-[55vh] overflow-hidden">
        {movies[0]?.backdrop_path && (
          <img 
            src={getTMDBImageUrl(movies[0].backdrop_path, 'original')!} 
            className="w-full h-full object-cover opacity-20 dark:opacity-30 blur-2xl scale-110"
            alt="backdrop"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10 -mt-32 sm:-mt-48">
        <div className="mb-10 sm:mb-16">
           <BackButton className="bg-foreground/5 hover:bg-foreground/10 text-foreground/60 rounded-2xl px-6 py-2.5 backdrop-blur-xl border border-foreground/5 shadow-xl transition-all" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Avatar & Personal Stats */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-10 group">
            <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden shadow-apple-lg border border-white/5 ring-1 ring-white/5 animate-in zoom-in-95 duration-700 bg-surface">
              {profileImg ? (
                <img src={profileImg} alt={actor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-2000" />
              ) : (
                <div className="w-full h-full bg-foreground/[0.03] flex items-center justify-center text-foreground/5">
                  <User className="w-24 h-24" />
                </div>
              )}
            </div>
            
            <div className="flex justify-center lg:justify-start">
               <FavoriteActorBtn 
                 actorId={actor.id} 
                 actorName={actor.name} 
                 profilePath={actor.profile_path}
                 type="topxx" 
                 className="w-full sm:w-auto px-10 py-5 rounded-[24px] shadow-apple-lg active-depth bg-yellow-500 text-black border-none font-black uppercase tracking-widest italic"
               />
            </div>

            <div className="space-y-8 bg-surface/50 backdrop-blur-xl border border-white/5 p-10 rounded-[40px] shadow-2xl">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">Hồ sơ nghệ sĩ</h3>
              <div className="space-y-6">
                {actor.birthday && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Ngày sinh</span>
                    <span className="text-foreground font-bold text-lg flex items-center gap-3">
                       <CalendarDays className="w-4 h-4 text-yellow-500/40" /> {actor.birthday}
                    </span>
                  </div>
                )}
                {actor.place_of_birth && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Nơi sinh</span>
                    <span className="text-foreground font-semibold text-sm leading-relaxed flex items-start gap-3">
                       <MapPin className="w-4 h-4 text-yellow-500/40 mt-0.5" /> {actor.place_of_birth}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Điểm phổ biến</span>
                  <span className="text-yellow-500 font-black text-2xl flex items-center gap-3 italic">
                    <TrendingUp className="w-6 h-6" /> {actor.popularity.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Biography & Filmography */}
          <div className="flex-1 space-y-20">
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
              <div className="space-y-4">
                 <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-foreground tracking-tighter leading-[0.9] italic uppercase">{actor.name}</h1>
                 <div className="h-1.5 w-24 bg-yellow-500 rounded-full" />
              </div>
              
              {actor.biography ? (
                <div className="text-foreground/60 leading-relaxed text-lg sm:text-xl font-medium max-w-4xl opacity-80 decoration-yellow-500/10 decoration-wavy underline underline-offset-8">
                  {actor.biography.split('\n').filter((line: string) => line.trim()).slice(0, 3).join('\n\n')}
                  {actor.biography.split('\n').length > 3 && " ..."}
                </div>
              ) : (
                <p className="text-foreground/20 italic text-xl font-medium tracking-tight">Chưa cập nhật tiểu sử nghệ sĩ.</p>
              )}
            </div>

            <section className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter flex items-center gap-4">
                     Tác phẩm tiêu biểu
                     <span className="text-[10px] font-black bg-yellow-500 text-black px-3 py-1 rounded-full uppercase tracking-tighter ml-2">TOP RATED</span>
                   </h2>
                   <p className="text-foreground/30 text-sm font-bold uppercase tracking-widest italic">Kho phim ấn tượng của {actor.name.split(' ').pop()}</p>
                </div>
                <div className="flex items-center gap-4 text-foreground/20 font-black uppercase tracking-[0.3em] text-[10px]">
                   <span>Tổng số</span>
                   <span className="text-yellow-500 text-[24px] font-black italic">{movies.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
                {movies.map((m: any, idx: number) => (
                  <Link 
                    key={m.id} 
                    href={`/${TOPXX_PATH}/search?q=${encodeURIComponent(m.title || m.name)}`} 
                    className="group flex flex-col gap-5 active-depth"
                  >
                    <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden bg-surface shadow-2xl border border-white/5 group-hover:border-yellow-500/50 transition-all duration-500">
                      <img
                        src={getTMDBImageUrl(m.poster_path, 'w342') || "https://dummyimage.com/500x750/111/fff&text=No+Poster"}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                         <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 delay-100">
                            <Star className="w-5 h-5 fill-current" />
                         </div>
                      </div>
                      
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                         <span className="text-[10px] font-black text-white italic">{(m.release_date || m.first_air_date || "").split('-')[0]}</span>
                      </div>
                    </div>
                    
                    <div className="px-1 space-y-1.5">
                      <p className="text-[14px] font-black uppercase italic tracking-tighter text-foreground group-hover:text-yellow-500 transition-colors line-clamp-1">{m.title || m.name}</p>
                      {m.character && (
                        <p className="text-[10px] text-foreground/20 uppercase tracking-widest line-clamp-1 font-bold italic">vai {m.character}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
