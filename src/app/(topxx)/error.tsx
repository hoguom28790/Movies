"use client";

import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function TopXXError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[TopXX] Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-surface rounded-[48px] border border-foreground/10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center ring-8 ring-red-500/5">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-foreground font-headline">
          Hệ thống gặp sự cố
        </h2>
        <p className="text-foreground/40 font-black uppercase tracking-widest text-[12px] max-w-md mx-auto leading-relaxed">
          Đã có lỗi xảy ra trong quá trình xử lý dữ liệu. Vui lòng tải lại trang hoặc thử lại sau ít phút.
        </p>
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-4 px-10 py-5 bg-primary text-[14px] font-black text-white rounded-[24px] uppercase italic tracking-widest shadow-2xl hover:bg-primary/80 transition-all active:scale-95 group"
      >
        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        Thử lại ngay
      </button>

      {error.digest && (
        <p className="text-foreground/5 text-[9px] font-mono uppercase">
          ID: {error.digest}
        </p>
      )}
    </div>
  );
}
