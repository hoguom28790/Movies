"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TraktConnectBtn } from "@/components/auth/TraktConnectBtn";
import { UserCircle, Shield, Bell, Smartphone, LogOut, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (!loading && !user) {
      redirect("/");
    }
  }, [user, loading]);

  if (!mounted || loading || !user) {
    return <div className="min-h-screen bg-background pt-24" />;
  }

  const handleLogout = async () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      await logout();
      redirect("/");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-20 sm:pt-32 sm:pb-32">
       {/* Background Decorative Elements */}
       <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] right-[15%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
       </div>

      <div className="container mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <div className="space-y-2 px-2">
           <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground leading-tight">
             Cài đặt
           </h1>
           <p className="text-sm font-medium text-foreground-secondary tracking-tight">
             Quản lý tài khoản và tùy chọn trải nghiệm của bạn
           </p>
        </div>
        
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="apple-glass rounded-[32px] p-6 sm:p-8 flex items-center justify-between shadow-apple-lg border-foreground/5"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              {user.photoURL ? (
                <img src={user.photoURL || undefined} alt="Avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/20 object-cover shadow-sm" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary/40" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full shadow-sm" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{user.displayName || "Người dùng"}</h2>
              <p className="text-foreground-secondary text-sm font-medium">{user.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-4">
          <section className="apple-glass rounded-[32px] p-8 border-foreground/5 shadow-apple overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <Smartphone size={20} />
               </div>
               <h3 className="text-lg font-bold text-foreground">Đồng bộ hóa (Trakt.tv)</h3>
            </div>
            
            <p className="text-foreground-secondary text-sm mb-8 leading-relaxed font-medium">
              Kết nối với hệ sinh thái Trakt để tự động sao lưu lịch sử xem phim và đồng bộ kho phim yêu thích trên mọi nền tảng.
            </p>
            
            <div className="max-w-xs">
              <TraktConnectBtn />
            </div>
          </section>

          {/* Placeholder sections for the feeling of a full settings page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="apple-glass rounded-[32px] p-6 border-foreground/5 opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all group cursor-not-allowed">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-secondary group-hover:text-primary transition-colors">
                      <Shield size={16} />
                   </div>
                   <span className="text-sm font-bold">Bảo mật</span>
                </div>
                <p className="text-[11px] text-foreground-secondary leading-snug">Cập nhật mật khẩu và bảo mật hai lớp</p>
             </div>

             <div className="apple-glass rounded-[32px] p-6 border-foreground/5 opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all group cursor-not-allowed">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-secondary group-hover:text-primary transition-colors">
                      <Bell size={16} />
                   </div>
                   <span className="text-sm font-bold">Thông báo</span>
                </div>
                <p className="text-[11px] text-foreground-secondary leading-snug">Quản lý thông báo tập mới và sự kiện</p>
             </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-10 text-center space-y-2 opacity-20 hover:opacity-100 transition-opacity duration-500 select-none">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Hồ Phim Premium Edition</p>
           <p className="text-[9px] font-bold">Version 4.0.2 Stable Core</p>
        </div>
      </div>
    </div>
  );
}
