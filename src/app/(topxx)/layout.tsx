import React from "react";
import Link from "next/link";
import { AlertCircle, LogOut, User, Home } from "lucide-react";

export default function TopXXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-xx min-h-screen bg-background text-primaryoreground">
      {/* 18+ Warning Banner */}
      <div className="bg-amber-500 text-black py-2 px-4 flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest z-[1100] relative">
        <AlertCircle className="w-4 h-4" />
        Nội dung 18+ - Chỉ dành cho người lớn - Cân nhắc trước khi xem
      </div>

      <div className="flex flex-col">
        <header className="fixed top-9 z-[1000] w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300 pt-safe">
          <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
            <Link href="/topxx" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter text-primary font-headline italic">TopXX 🎬</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link href="/topxx" className="p-2 text-white/60 hover:text-primary transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <Link href="/settings" className="p-2 text-white/60 hover:text-primary transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <Link href="/" className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[12px] font-bold transition-all border border-white/5">
                Quay về Hồ Phim
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow pt-32 pb-safe px-4 lg:px-12">
          {children}
        </main>
        
        <footer className="py-20 border-t border-white/[0.06] bg-[#050505] text-center">
          <div className="container mx-auto px-4">
             <span className="text-xl font-black italic tracking-tighter text-primary mb-4 block">TopXX</span>
             <p className="text-white/20 text-[12px] max-w-md mx-auto mb-8">
               Nội dung được cung cấp chỉ dành cho mục đích cá nhân. Vui lòng không chia sẻ cho người dưới 18 tuổi.
             </p>
             <Link href="/" className="text-primary hover:text-primary-hover font-bold text-sm underline underline-offset-4">
                Quay lại Hồ Phim
             </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
