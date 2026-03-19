"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { saveTraktTokens, getTraktTokens, disconnectTrakt, getUserHistory } from "@/services/db";
import { pushHistoryToTrakt } from "@/services/trakt";
import { Tv, Loader2, Unlink, RefreshCw } from "lucide-react";

export function TraktConnectBtn() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getTraktTokens(user.uid).then((tokens) => {
        setIsConnected(!!tokens);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data === 'object' && event.data?.type === 'TRAKT_AUTH_SUCCESS') {
        if (user) {
          setLoading(true);
          await saveTraktTokens(user.uid, event.data.tokens);
          setIsConnected(true);
          setLoading(false);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user]);

  const handleConnect = () => {
    if (!user) return alert("Vui lòng đăng nhập trước!");
    
    const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/trakt/callback`;
    const url = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(url, "TraktConnect", `width=${width},height=${height},left=${left},top=${top}`);
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (confirm("Bạn có chắc muốn ngắt kết nối Trakt? Dữ liệu trên Trakt vẫn sẽ được giữ nguyên.")) {
      setLoading(true);
      await disconnectTrakt(user.uid);
      setIsConnected(false);
      setLoading(false);
    }
  };

  const handleSyncHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tokens = await getTraktTokens(user.uid);
      if (!tokens) throw new Error("Chưa kết nối");
      
      const history = await getUserHistory(user.uid);
      if (history.length === 0) {
        alert("Lịch sử xem phim trống!");
        setLoading(false);
        return;
      }
      
      const success = await pushHistoryToTrakt(tokens.access_token, history);
      if (success) {
        alert(`Thành công! Đã đẩy ${history.length} phim lên Trakt.tv`);
      } else {
        alert("Lỗi khi đẩy dữ liệu lên Trakt.");
      }
    } catch (e) {
      alert("Đã xảy ra lỗi hệ thống.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Button variant="secondary" disabled className="w-full gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra Trakt...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Button onClick={handleSyncHistory} variant="primary" className="w-full gap-2">
          <RefreshCw className="w-4 h-4" /> Đồng bộ Lịch sử Lên Trakt
        </Button>
        <Button variant="secondary" onClick={handleDisconnect} className="w-full gap-2 text-red-500 hover:text-red-400 bg-white/5 hover:bg-white/10">
          <Unlink className="w-4 h-4" /> Ngắt kết nối Trakt.tv
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} className="w-full gap-2 bg-primary hover:bg-primary/80 text-white font-bold tracking-wide">
      <Tv className="w-4 h-4" /> Liên Kết Trakt.tv
    </Button>
  );
}
