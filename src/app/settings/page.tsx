"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TraktConnectBtn } from "@/components/auth/TraktConnectBtn";
import { UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      redirect("/");
    }
  }, [user, loading]);

  if (loading || !user) {
    return <div className="min-h-screen bg-black pt-24" />;
  }

  return (
    <div className="min-h-screen bg-black pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">
          Cài Đặt Tài Khoản
        </h1>
        
        <div className="bg-white/5 rounded-2xl p-6 mb-8 flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-primary object-cover" />
          ) : (
            <UserCircle className="w-16 h-16 text-white/50" />
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{user.displayName || "Người dùng"}</h2>
            <p className="text-white/60 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Đồng bộ hóa (Trakt.tv)</h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Kết nối tài khoản mã bảo mật OAuth2 với hệ sinh thái Trakt để tự động sao lưu lịch sử xem phim và đồng bộ kho phim yêu thích trên mọi nền tảng.
            </p>
            <div className="max-w-[250px]">
              <TraktConnectBtn />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
