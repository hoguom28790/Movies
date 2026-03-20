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
      <div className="container mx-auto pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
           <button 
             onClick={() => setIsPlaying(false)}
             className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
           >
              <ArrowLeft className="w-4 h-4" /> Quay lại thông tin
           </button>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mr-2">Chặn quảng cáo để có trải nghiệm tốt nhất</span>
           </div>
        </div>

        <div className="space-y-8">
          <div className="w-full">
             <XXPlayer 
                url={currentSource.link}
                isHls={currentSource.link.includes('.m3u8') || currentSource.link.includes('m3u8')}
                rawEmbedUrl={(!currentSource.link.includes('.m3u8') && !currentSource.link.includes('.mp4') && !currentSource.link.includes('.mkv')) ? currentSource.link : ""}
                movieTitle={title}
                movieCode={movieCode}
                posterUrl={poster}
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5">
                   <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                      {title}
                   </h1>
                   <div className="flex flex-wrap items-center gap-3 mb-8">
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-black font-black text-[10px] rounded-full uppercase italic">
                        {isAVDB ? "AVDB PREMIUM" : "TOPXX VIP"}
                      </div>
                      <XXFavoriteBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                      <XXPlaylistBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                   </div>

                   <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Server className="w-4 h-4" /> {isAVDB ? "Chọn Tập Phim" : "Chọn Server (Nguồn phát)"}
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {sources.map((src: any, idx: number) => (
                        <Button
                          key={idx}
                          variant={currentServer === idx ? "primary" : "secondary"}
                          onClick={() => setCurrentServer(idx)}
                          className={`h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-white/5 ${
                            currentServer === idx ? "shadow-xl shadow-yellow-500/20 text-black" : "bg-white/5"
                          }`}
                        >
                          {src.name || `Tập ${idx + 1}`}
                        </Button>
                      ))}
                   </div>
                </div>
                
                <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5">
                   <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Nội dung phim</h4>
                   <div className="text-white/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content || "Không có mô tả..." }} />
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5">
                   <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-6">Thông tin chi tiết</h3>
                   <ul className="space-y-6">
                      <DetailItem icon={<Tag className="w-3.5 h-3.5"/>} label="Thể loại" items={isAVDB ? (Array.isArray(item.category) ? item.category.map((c: any) => ({ name: c, code: c })) : [{ name: item.category, code: item.category }]) : item.genres} path="/xx/the-loai" />
                      <DetailItem icon={<Globe className="w-3.5 h-3.5"/>} label="Quốc gia" items={isAVDB ? (Array.isArray(item.country) ? item.country.map((c: any) => ({ name: c, code: c })) : [{ name: item.country, code: item.country }]) : item.countries} path="/xx/quoc-gia" />
                      <DetailItem icon={<Users className="w-3.5 h-3.5"/>} label="Diễn viên" items={isAVDB ? (Array.isArray(item.actor) ? item.actor.map((a: any) => ({ trans: [{ locale: 'vi', name: a }] })) : item.actor?.split(',').map((a: any) => ({ trans: [{ locale: 'vi', name: a.trim() }] }))) : item.actors} path="/xx/dien-vien" isActor />
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh] rounded-[40px] overflow-hidden mb-12 group">
        <img src={poster} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-40 blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
           <div className="max-w-4xl space-y-8">
              <h1 className="text-5xl md:text-8xl font-black text-white drop-shadow-2xl tracking-tighter uppercase italic leading-[0.85]">
                 {title}
              </h1>
              <div className="flex flex-wrap justify-center items-center gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500 rounded-2xl text-black font-black uppercase tracking-widest text-sm shadow-2xl shadow-yellow-500/20">
                    <Play className="w-4 h-4 fill-current" /> {isAVDB ? item.quality : item.quality || "HD"}
                 </div>
                 <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl text-white/70 font-bold border border-white/10 uppercase italic">
                    {isAVDB ? item.year : (item.publish_at ? new Date(item.publish_at).getFullYear() : "2024")}
                 </div>
                 <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl text-white/70 font-bold border border-white/10 uppercase tracking-widest text-xs">
                    {isAVDB ? (item.status || "N/A") : (item.duration || "N/A")}
                 </div>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-6 pt-4">
                 <Button 
                   onClick={() => {
                      setIsPlaying(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   size="lg" 
                   className="h-16 px-12 rounded-3xl font-black text-xl uppercase tracking-widest group/play shadow-2xl shadow-yellow-500/30"
                 >
                    <Play className="w-6 h-6 mr-3 fill-current group-hover/play:scale-125 transition-transform" /> Xem Phim
                 </Button>
                 
                 <div className="flex flex-wrap items-center justify-center gap-3">
                    <XXFavoriteBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                    <XXPlaylistBtn movieCode={movieCode} movieTitle={title} posterUrl={poster} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
           <div className="bg-white/[0.02] rounded-[40px] p-10 border border-white/5">
              <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6">Tóm tắt nội dung</h3>
              <div 
                className="text-lg text-white/60 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: content || "Nội dung đang được cập nhật..." }}
              />
           </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/[0.03] rounded-[40px] p-8 border border-white/5 backdrop-blur-xl">
             <h3 className="text-sm font-black text-white mb-8 border-b border-white/5 pb-6 uppercase tracking-[0.2em] text-yellow-500">Thông tin phim</h3>
             <ul className="space-y-8">
               <DetailItem 
                  icon={<Tag className="w-4 h-4" />} 
                  label="Thể loại" 
                  items={isAVDB ? (Array.isArray(item.category) ? item.category.map((c: any) => ({ name: c, code: c })) : [{ name: item.category, code: item.category }]) : item.genres} 
                  path="/xx/the-loai" 
               />
               <DetailItem 
                  icon={<Globe className="w-4 h-4" />} 
                  label="Quốc gia" 
                  items={isAVDB ? (Array.isArray(item.country) ? item.country.map((c: any) => ({ name: c, code: c })) : [{ name: item.country, code: item.country }]) : item.countries} 
                  path="/xx/quoc-gia" 
               />
               <DetailItem 
                  icon={<Users className="w-4 h-4" />} 
                  label="Diễn viên" 
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
