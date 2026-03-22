"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { saveTraktTokens, getTraktTokens, disconnectTrakt } from "@/services/db";
import { Tv, Loader2, Unlink } from "lucide-react";

export function TraktConnectBtn() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [traktUser, setTraktUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    if (user) {
      const tokens = await getTraktTokens(user.uid);
      setIsConnected(!!tokens);
      setTraktUser(tokens?.username || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, [user]);

  const handleConnect = () => {
    if (!user) return alert("Vui lòng đăng nhập trước!");
    
    const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/trakt/callback`;
    const url = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.uid}`;
    
    // Redirect main window for better Flow
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (confirm("Bạn có chắc muốn ngắt kết nối Trakt? Dữ liệu trên Trakt vẫn sẽ được giữ nguyên.")) {
      setLoading(true);
      await disconnectTrakt(user.uid);
      setIsConnected(false);
      setTraktUser(null);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="secondary" disabled className="w-full gap-2 py-6 rounded-2xl">
        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Đang kiểm tra Trakt...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="space-y-4 w-full">
         <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
             <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Tv className="w-6 h-6 text-white" />
             </div>
            <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Đã kết nối</p>
               <p className="text-sm font-bold text-white">{traktUser || "Người dùng Trakt"}</p>
            </div>
         </div>
         <Button variant="secondary" onClick={handleDisconnect} className="w-full gap-2 py-4 rounded-xl text-red-500 hover:text-white hover:bg-red-500 border-white/5 bg-white/5 transition-all">
            <Unlink className="w-4 h-4" /> Ngắt kết nối Trakt.tv
         </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} className="w-full h-14 rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[13px] shadow-xl shadow-primary/20 transition-all active:scale-95">
      <Tv className="w-5 h-5" /> Liên Kết Trakt.tv
    </Button>
  );
}
