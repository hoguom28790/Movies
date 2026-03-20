"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Calendar, Globe, Tag, Users, ArrowLeft, Server } from "lucide-react";
import { XXPlayer } from "@/components/layout/XXPlayer";
import { XXFavoriteBtn } from "@/components/movie/XXFavoriteBtn";
import { XXPlaylistBtn } from "@/components/movie/XXPlaylistBtn";
import { Button } from "@/components/ui/Button";

interface XXMovieDetailClientProps {
  item: any;
  slug: string;
  autoPlay?: boolean;
}

export default function XXMovieDetailClient({ item, slug, autoPlay }: XXMovieDetailClientProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay || false);
  const [currentServer, setCurrentServer] = useState(0);

  // Normalize data between sources
  const isAVDB = item.source === 'avdb';
  const title = isAVDB ? item.title : (item.trans?.find((t: any) => t.locale === "vi")?.title || item.trans?.[0]?.title);
  const content = isAVDB ? item.content : (item.trans?.find((t: any) => t.locale === "vi")?.content || item.trans?.[0]?.content);
  const poster = isAVDB ? item.posterUrl : item.thumbnail;
  
  // Normalize sources/servers
  const sources = isAVDB 
    ? (item.servers?.[0]?.episodes || []).map((ep: any) => ({ 
        name: ep.name, 
        link: ep.link 
      }))
    : (item.sources || []);

  const movieCode = isAVDB ? item.id : item.code;

  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [autoPlay]);

  if (isPlaying && sources.length > 0) {
    const currentSource = sources[currentServer] || sources[0];
    
    return (
      <div className="container mx-auto px-4 md:px-8 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-8">
           <button 
             onClick={() => setIsPlaying(false)}
             className="group flex items-center gap-3 text-white/40 hover:text-white transition-all font-black uppercase italic tracking-[0.2em] text-[10px]"
           >
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Quay lại thông tin
           </button>
           <div className="hidden md:flex items-center gap-2 group cursor-default">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-yellow-500/40 transition-colors">Trải nghiệm điện ảnh đỉnh cao không quảng cáo</span>
           </div>
        </div>

        <div className="space-y-12">
          <div className="w-full relative group">
             <div className="absolute -inset-1 bg-yellow-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
             <XXPlayer 
                url={currentSource.link}
                isHls={currentSource.link.includes('.m3u8') || currentSource.link.includes('m3u8')}
                rawEmbedUrl={(!currentSource.link.includes('.m3u8') && !currentSource.link.includes('.mp4') && !currentSource.link.includes('.mkv')) ? currentSource.link : ""}
                movieTitle={title}
                movieCode={movieCode}
                posterUrl={poster}
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface border border-white/5 rounded-[40px] p-8 md:p-12 transition-all hover:border-white/10">
                   <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">
                      {title}
                   </h1>
                   <div className="flex flex-wrap items-center gap-4 mb-10 pb-10 border-b border-white/5">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500 text-black font-black text-[10px] rounded-xl uppercase italic shadow-lg shadow-yellow-500/20">
                        {isAVDB ? "AVDB PREMIUM" : "TOPXX VIP"}
                      </div>
                      <XXFavoriteBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                      <XXPlaylistBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                   </div>

                   <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                      <Server className="w-4 h-4 text-yellow-500" /> {isAVDB ? "Danh sách tập" : "Chọn nguồn phát"}
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {sources.map((src: any, idx: number) => (
                        <Button
                          key={idx}
                          variant={currentServer === idx ? "primary" : "secondary"}
                          onClick={() => setCurrentServer(idx)}
                          className={`h-14 rounded-2xl font-black text-[11px] uppercase italic tracking-tighter border-white/5 transition-all ${
                            currentServer === idx 
                              ? "bg-yellow-500 text-black shadow-2xl shadow-yellow-500/30 active:scale-95" 
                              : "bg-white/[0.03] hover:bg-white/10 active:scale-95"
                          }`}
                        >
                          {src.name || `Tập ${idx + 1}`}
                        </Button>
                      ))}
                   </div>
                </div>
                
                <div className="bg-white/[0.01] rounded-[40px] p-8 md:p-12 border border-white/5 border-dashed">
                   <h4 className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] mb-6">Mô tả</h4>
                   <div className="text-white/50 text-base leading-relaxed italic md:leading-loose" dangerouslySetInnerHTML={{ __html: content || "Nội dung đang được xử lý..." }} />
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-surface border border-white/5 rounded-[40px] p-10 backdrop-blur-3xl sticky top-24">
                   <h3 className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                     Dữ liệu chi tiết
                   </h3>
                   <ul className="space-y-10">
                      <DetailItem icon={<Tag className="w-4 h-4 text-white/20"/>} label="Thể loại" items={isAVDB ? (Array.isArray(item.category) ? item.category.map((c: any) => ({ name: c, code: c })) : [{ name: item.category, code: item.category }]) : item.genres} path="/xx/the-loai" />
                      <DetailItem icon={<Globe className="w-4 h-4 text-white/20"/>} label="Quốc gia" items={isAVDB ? (Array.isArray(item.country) ? item.country.map((c: any) => ({ name: c, code: c })) : [{ name: item.country, code: item.country }]) : item.countries} path="/xx/quoc-gia" />
                      <DetailItem icon={<Users className="w-4 h-4 text-white/20"/>} label="Diễn viên" items={isAVDB ? (Array.isArray(item.actor) ? item.actor.map((a: any) => ({ trans: [{ locale: 'vi', name: a }] })) : item.actor?.split(',').map((a: any) => ({ trans: [{ locale: 'vi', name: a.trim() }] }))) : item.actors} path="/xx/dien-vien" isActor />
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-0 pb-32 animate-in fade-in slide-in-from-bottom-5 duration-1000 max-w-7xl">
      {/* Hero Section */}
      <div className="relative w-full h-[65vh] md:h-[80vh] rounded-[50px] overflow-hidden mb-16 group shadow-2xl shadow-black">
        <img 
          src={poster} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110 opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 md:hidden" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-12 md:pb-20">
           <div className="max-w-4xl space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-yellow-500 text-black font-black text-[10px] rounded-full uppercase italic shadow-2xl shadow-yellow-500/40 animate-bounce-subtle">
                   <Calendar className="w-3.5 h-3.5" />
                   {isAVDB ? item.year : (item.publish_at ? new Date(item.publish_at).getFullYear() : "2025")}
                </div>
                <h1 className="text-5xl md:text-[120px] font-black text-white tracking-tighter uppercase italic leading-[0.85] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                   {title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[11px] border border-white/5">
                    {isAVDB ? item.quality : item.quality || "ULTRA HD"}
                 </div>
                 <div className="px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl text-white/80 font-black border border-white/5 uppercase tracking-[0.2em] text-[11px] italic">
                    {isAVDB ? (item.status || "EXCLUSIVE") : (item.duration || "SERIES")}
                 </div>
                 <div className="px-5 py-2.5 bg-yellow-500/10 backdrop-blur-xl rounded-2xl text-yellow-500 font-black border border-yellow-500/20 uppercase tracking-[0.2em] text-[11px]">
                    PREMIUM
                 </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 pt-6">
                 <Button 
                   onClick={() => {
                      setIsPlaying(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   size="lg" 
                   className="w-full md:w-auto h-20 px-16 rounded-[30px] font-black text-2xl uppercase italic tracking-tighter group/play shadow-[0_20px_40px_-12px_rgba(234,179,8,0.4)] bg-yellow-500 text-black hover:bg-white hover:text-black transition-all duration-500"
                 >
                    <Play className="w-8 h-8 mr-4 fill-current group-hover/play:scale-125 transition-transform duration-500" /> Xem ngay
                 </Button>
                 
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <XXFavoriteBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                    <XXPlaylistBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-20">
        <div className="lg:col-span-2 space-y-16">
           <div className="bg-surface rounded-[50px] p-10 md:p-16 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -z-10 group-hover:bg-yellow-500/10 transition-colors" />
              <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                 <span className="w-12 h-px bg-white/10" />
                 Storyline
              </h3>
              <div 
                className="text-xl md:text-2xl text-white/60 leading-relaxed font-medium italic"
                dangerouslySetInnerHTML={{ __html: content || "Câu chuyện đang được kể lại..." }}
              />
           </div>
        </div>

        <div className="space-y-12">
          <div className="bg-surface border border-white/5 rounded-[50px] p-12 backdrop-blur-3xl sticky top-24 shadow-2xl">
             <h3 className="text-[12px] font-black text-white mb-12 border-b border-white/5 pb-8 uppercase tracking-[0.3em] text-yellow-500 italic">Metadata</h3>
             <ul className="space-y-12">
               <DetailItem 
                  icon={<Tag className="w-4 h-4" />} 
                  label="Category" 
                  items={isAVDB ? (Array.isArray(item.category) ? item.category.map((c: any) => ({ name: c, code: c })) : [{ name: item.category, code: item.category }]) : item.genres} 
                  path="/xx/the-loai" 
               />
               <DetailItem 
                  icon={<Globe className="w-4 h-4" />} 
                  label="Production" 
                  items={isAVDB ? (Array.isArray(item.country) ? item.country.map((c: any) => ({ name: c, code: c })) : [{ name: item.country, code: item.country }]) : item.countries} 
                  path="/xx/quoc-gia" 
               />
               <DetailItem 
                  icon={<Users className="w-4 h-4" />} 
                  label="Starring" 
                  items={isAVDB ? (Array.isArray(item.actor) ? item.actor.map((a: any) => ({ trans: [{ locale: 'vi', name: a }] })) : item.actor?.split(',').map((a: any) => ({ trans: [{ locale: 'vi', name: a.trim() }] }))) : item.actors} 
                  path="/xx/dien-vien" 
                  isActor 
               />
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


function DetailItem({ icon, label, items, path, isActor = false }: any) {
  return (
    <li className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {items?.map((g: any, idx: number) => {
          const name = g.trans?.find((t: any) => t.locale === "vi")?.name || g.code || (isActor ? (g.trans?.find((t: any) => t.locale === "vi")?.name || "Actor") : "Unknown");
          let slug = g.code || "";
          
          if (isActor) {
            const actorName = g.trans?.find((t: any) => t.locale === "vi")?.name || "Actor";
            slug = actorName.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[đĐ]/g, "d")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
          }

          return (
            <Link 
              key={idx} 
              href={`${path}/${slug}`}
              className="px-3.5 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[13px] font-bold text-white/80 hover:text-yellow-500 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all"
            >
              {name || (isActor ? "Diễn viên" : "Thể loại")}
            </Link>
          );
        })}
      </div>
    </li>
  );
}
