"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Genre {
  name: string;
  slug: string;
}

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
  "18-plus": "🔞", // Placeholder if slug is 18-plus or similar
};

export function GenreGrid({ genres }: { genres: Genre[] }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenreClick = (e: React.MouseEvent, slug: string, name: string) => {
    // Check for 18+ patterns in name or slug
    if (name.includes("18+") || name.toLowerCase().includes("xxx") || slug.includes("18-plus")) {
      e.preventDefault();
      setSelectedSlug(slug);
      setShowPasswordModal(true);
      setError("");
      setPassword("");
    }
  };

  const verifyPassword = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const correctPass = `${day}${month}${year}`;

    if (password === correctPass) {
      setShowPasswordModal(false);
      if (selectedSlug) router.push(`/the-loai/${selectedSlug}`);
    } else {
      setError("Mật khẩu không chính xác. Định dạng: DDMMYYYY (Ngày hiện tại)");
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {genres.map((genre) => (
          <Link
            key={genre.slug}
            href={`/the-loai/${genre.slug}`}
            onClick={(e) => handleGenreClick(e, genre.slug, genre.name)}
            className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-surface border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">
              {genreEmojis[genre.slug] || (genre.name.includes("18+") ? "🔞" : "🎬")}
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="text-5xl">🔞</span>
              <h2 className="text-2xl font-black text-white">Xác Minh Độ Tuổi</h2>
            </div>

            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.2em] text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                autoFocus
              />
              {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={verifyPassword}
                className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/80 text-sm font-bold text-white transition-all shadow-lg shadow-primary/20"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
