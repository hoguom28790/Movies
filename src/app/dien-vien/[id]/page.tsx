import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, Film, CalendarDays } from "lucide-react";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { FavoriteActorBtn } from "@/components/movie/FavoriteActorBtn";

export default async function ActorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getTMDBActorDetails(parseInt(id, 10));

  if (!actor || actor.success === false) return notFound();

  const profileImg = getTMDBImageUrl(actor.profile_path);
  const movies = (actor.movie_credits?.cast || [])
    .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 24);

  return (
    <div className="min-h-screen pb-20">
      {/* ── Header ── */}
      <div className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        {movies[0]?.backdrop_path && (
          <img 
            src={getTMDBImageUrl(movies[0].backdrop_path)!} 
            className="w-full h-full object-cover opacity-20 blur-xl scale-110"
            alt="backdrop"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 -mt-40">
        <Link 
          href="javascript:history.back()" 
          className="inline-flex items-center gap-2 text-sm font-bold text-white/40 hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </Link>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Avatar & Bio */}
          <div className="w-full md:w-80 flex-shrink-0 space-y-6">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
              {profileImg ? (
                <img src={profileImg} alt={actor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/10">
                  <Film className="w-20 h-20" />
                </div>
              )}
            </div>
            
            <FavoriteActorBtn 
              actorId={actor.id} 
              actorName={actor.name} 
              profilePath={actor.profile_path} 
            />

            <div className="space-y-4 bg-white/5 border border-white/10 p-6 rounded-3xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/30">Thông tin</h3>
              <div className="space-y-3">
                {actor.birthday && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Ngày sinh</span>
                    <span className="text-white font-bold">{actor.birthday}</span>
                  </div>
                )}
                {actor.place_of_birth && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-white/40">Nơi sinh</span>
                    <span className="text-white font-bold">{actor.place_of_birth}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Sức ảnh hưởng</span>
                  <span className="text-yellow-500 font-bold">{actor.popularity.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Filmo */}
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-white">{actor.name}</h1>
              {actor.biography ? (
                <div className="text-neutral-400 leading-relaxed text-base italic line-clamp-6 md:line-clamp-none whitespace-pre-wrap">
                  {actor.biography}
                </div>
              ) : (
                <p className="text-white/20 italic">Chưa có thông tin tiểu sử.</p>
              )}
            </div>

            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  Phim Đã Tham Gia
                </h2>
                <span className="text-sm font-bold text-white/20 uppercase tracking-widest">
                  {movies.length} Tác phẩm
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {movies.map((m: any) => (
                  <Link key={m.id} href={`/search?q=${encodeURIComponent(m.title || m.name)}`} className="group space-y-3">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 group-hover:-translate-y-2 transition-transform duration-300 shadow-lg group-hover:shadow-primary/10">
                      <img
                        src={getTMDBImageUrl(m.poster_path) || "https://dummyimage.com/500x750/111/fff&text=No+Poster"}
                        alt={m.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{m.title || m.name}</p>
                      {m.character && (
                        <p className="text-[10px] text-white/30 uppercase tracking-tighter line-clamp-1 mt-0.5 italic">vai {m.character}</p>
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
