"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, BookOpen } from "lucide-react";

interface HomeComicGridProps {
  title: string;
  comics: any[];
  domainCdn: string;
  viewAllHref?: string;
}

export function HomeComicGrid({ title, comics, domainCdn, viewAllHref }: HomeComicGridProps) {
  if (comics.length === 0) return null;

  return (
    <section className="mt-12 px-6 lg:px-12 container mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black font-headline tracking-tight text-white uppercase">
            {title}
          </h3>
          <div className="h-1 w-12 bg-indigo-500 mt-1 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        </div>
        {viewAllHref && (
          <Link 
            href={viewAllHref}
            className="text-indigo-400 text-[12px] font-black flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform"
          >
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {comics.slice(0, 12).map((comic: any) => (
          <div key={comic._id} className="space-y-3 group">
            <Link 
              href={`/truyen/${comic.slug}`}
              className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-surface block shadow-xl border border-white/5 hover:border-indigo-500/30 transition-all"
            >
              <Image 
                src={`${domainCdn}/uploads/comics/${comic.thumb_url}`} 
                alt={comic.name} 
                fill
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                unoptimized={true}
              />
              <div className="absolute top-3 right-3">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg border border-white/10 uppercase tracking-tighter">
                  {comic.chaptersLatest?.[0]?.chapter_name ? `C. ${comic.chaptersLatest[0].chapter_name}` : "NEW"}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            <div>
              <Link 
                href={`/truyen/${comic.slug}`}
                className="font-black text-sm text-white/90 hover:text-indigo-400 transition-colors line-clamp-1 uppercase tracking-tight"
              >
                {comic.name}
              </Link>
              <p className="text-white/30 text-[11px] font-bold mt-1 uppercase tracking-widest truncate">
                {comic.category?.map((c: any) => c.name).join(" • ") || "Manga"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
