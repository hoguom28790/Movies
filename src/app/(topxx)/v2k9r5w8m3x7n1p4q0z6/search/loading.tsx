import React from "react";

export default function TopXXSearchLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-12">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-[8px] border-yellow-500/10 border-t-yellow-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-[4px] border-yellow-500/20 border-b-yellow-500 animate-[spin_1.5s_linear_infinite_reverse]" />
        </div>
      </div>
      
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white animate-pulse">
          Đang truy xuất dữ liệu...
        </h2>
        <p className="text-yellow-500/40 font-black uppercase tracking-[0.6em] text-[10px] italic">
          Elite Archive Streaming
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 w-full opacity-10 blur-sm pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-white/10 rounded-[40px] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
