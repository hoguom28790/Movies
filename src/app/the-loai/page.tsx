import Link from "next/link";
import { getGenreList } from "@/services/api/category";
import { LayoutGrid } from "lucide-react";

const genreEmojis: Record<string, string> = {
  "hanh-dong": "💥",
  "tinh-cam": "❤️",
  "hai-huoc": "😂",
  "co-trang": "🏯",
  "tam-ly": "🧠",
  "kinh-di": "👻",
  "vien-tuong": "🚀",
  "phieu-luu": "🗺️",
  "hoat-hinh": "🎨",
  "tai-lieu": "📽️",
  "xa-hoi-den": "🕵️",
  "bi-an": "🔍",
  "chien-tranh": "⚔️",
  "the-thao": "⚽",
  "the-thao-am-nhac": "🎶",
  "gia-dinh": "🏠",
};

export default async function TheLoaiPage() {
  const genres = await getGenreList();

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 mt-16 min-h-[70vh]">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary" />
          Tất Cả Thể Loại
        </h1>
        <p className="text-white/40 font-medium max-w-lg">
          Khám phá kho tàng phim đồ sộ được phân loại theo từng sở thích riêng biệt của bạn.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {genres.map((genre) => (
          <Link
            key={genre.slug}
            href={`/the-loai/${genre.slug}`}
            className="group relative flex flex-col items-center justify-center p-6 rounded-[var(--radius)] bg-surface border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 overflow-hidden"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">
              {genreEmojis[genre.slug] || "🎬"}
            </span>
            <span className="text-base font-bold text-white/80 group-hover:text-white transition-colors relative z-10 text-center">
              {genre.name}
            </span>
            
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">Khám Phá</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
