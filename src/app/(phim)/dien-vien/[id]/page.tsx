import { notFound } from "next/navigation";
import Link from "next/link";
import { Film, User, Star, MapPin, CalendarDays, TrendingUp, ExternalLink, Venus, Mars, Instagram, Twitter, Facebook, Globe } from "lucide-react";
import { getTMDBActorDetails, getTMDBImageUrl } from "@/services/tmdb";
import { FavoriteActorBtn } from "@/components/movie/FavoriteActorBtn";
import { ActorBiography } from "@/components/movie/ActorBiography";
import { ActorMovieGrid } from "@/components/movie/ActorMovieGrid";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";

export default async function ActorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getTMDBActorDetails(parseInt(id, 10));

  if (!actor || actor.success === false) return notFound();

  const profileImg = getTMDBImageUrl(actor.profile_path, 'w500');
  const allMovies = (actor.combined_credits?.cast || [])
    .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0));

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-500 relative">
      {/* ── Background Layer ── */}
      <div className="fixed inset-0 -z-20 bg-background" />

      {/* ── Header Backdrop ── */}
      <div className="relative w-full h-[35vh] sm:h-[45vh] lg:h-[55vh] overflow-hidden">
        {allMovies[0]?.backdrop_path && (
          <img 
            src={getTMDBImageUrl(allMovies[0].backdrop_path, 'original')!} 
            className="w-full h-full object-cover opacity-[0.05] dark:opacity-20 blur-3xl scale-110"
            alt="backdrop"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-16 relative z-10 -mt-32 sm:-mt-48">
        <div className="mb-10 sm:mb-16">
           <BackButton className="bg-foreground/5 hover:bg-foreground/10 text-foreground/60 rounded-2xl px-6 py-2.5 backdrop-blur-xl border border-foreground/5 shadow-xl transition-all" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Avatar & Personal Stats */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-10 group">
            <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden shadow-apple-lg border border-foreground/5 ring-1 ring-white/5 animate-in zoom-in-95 duration-700">
              {profileImg ? (
                <img src={profileImg} alt={actor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-2000" />
              ) : (
                <div className="w-full h-full bg-foreground/[0.03] flex items-center justify-center text-foreground/5">
                  <User className="w-24 h-24" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
               <FavoriteActorBtn 
                 actorId={actor.id} 
                 actorName={actor.name} 
                 profilePath={actor.profile_path} 
                 className="flex-1 sm:flex-none px-10 py-5 rounded-[24px] shadow-apple-lg active-depth"
               />
               <a 
                 href={`https://www.themoviedb.org/person/${actor.id}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 sm:flex-none px-8 py-5 rounded-[24px] apple-glass border-foreground/5 shadow-apple-lg flex items-center justify-center gap-2 text-foreground/40 hover:text-primary transition-all active-depth"
               >
                 <ExternalLink className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase tracking-widest">TMDB</span>
               </a>
            </div>

            <div className="space-y-8 apple-glass border-foreground/5 p-10 rounded-[40px] shadow-apple">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/20 italic">Hồ sơ cá nhân</h3>
              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Giới tính</span>
                  <span className="text-foreground font-bold text-lg flex items-center gap-3">
                    {actor.gender === 1 ? (
                      <>
                        <Venus className="w-4 h-4 text-pink-500/40" /> Nữ
                      </>
                    ) : actor.gender === 2 ? (
                      <>
                        <Mars className="w-4 h-4 text-blue-500/40" /> Nam
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-foreground/20" /> Khác
                      </>
                    )}
                  </span>
                </div>
                {actor.birthday && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Ngày sinh</span>
                    <span className="text-foreground font-bold text-lg flex items-center gap-3">
                       <CalendarDays className="w-4 h-4 text-primary/40" /> {actor.birthday}
                    </span>
                  </div>
                )}
                {actor.place_of_birth && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Nơi sinh</span>
                    <span className="text-foreground font-semibold text-sm leading-relaxed flex items-start gap-3">
                       <MapPin className="w-4 h-4 text-primary/40 mt-0.5" /> {actor.place_of_birth}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Điểm phổ biến</span>
                  <span className="text-primary font-black text-2xl flex items-center gap-3 italic">
                    <TrendingUp className="w-6 h-6" /> {actor.popularity.toFixed(1)}
                  </span>
                </div>

                {actor.external_ids && (
                  <div className="pt-6 border-t border-foreground/5 flex gap-4">
                    {actor.external_ids.instagram_id && (
                      <a href={`https://instagram.com/${actor.external_ids.instagram_id}`} target="_blank" rel="noopener" className="p-3 rounded-xl glass-pro border border-foreground/5 text-foreground/40 hover:text-pink-500 transition-all">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {actor.external_ids.twitter_id && (
                      <a href={`https://twitter.com/${actor.external_ids.twitter_id}`} target="_blank" rel="noopener" className="p-3 rounded-xl glass-pro border border-foreground/5 text-foreground/40 hover:text-blue-400 transition-all">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {actor.external_ids.facebook_id && (
                      <a href={`https://facebook.com/${actor.external_ids.facebook_id}`} target="_blank" rel="noopener" className="p-3 rounded-xl glass-pro border border-foreground/5 text-foreground/40 hover:text-blue-600 transition-all">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biography & Filmography */}
          <div className="flex-1 space-y-20">
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
              <div className="space-y-4">
                 <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-foreground tracking-tighter leading-[0.9] italic uppercase">{actor.name}</h1>
                 <div className="h-1.5 w-24 bg-primary rounded-full" />
              </div>
              
              {actor.biography ? (
                <ActorBiography 
                  biography={actor.biography} 
                />
              ) : (
                <p className="text-foreground/20 italic text-xl font-medium tracking-tight">Chưa cập nhật tiểu sử nghệ sĩ.</p>
              )}
            </div>

            <section className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
               <ActorMovieGrid allMovies={allMovies} actorName={actor.name} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
