"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export function RouteErrorToast() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("notfound") === "1") {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 5000);
      
      // Clean up URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("notfound");
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
      window.history.replaceState(null, "", newUrl);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[3000] min-w-[320px] px-6 py-4 bg-[#121214] border border-white/10 rounded-[20px] shadow-2xl backdrop-blur-3xl flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-2xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-black italic uppercase tracking-tighter text-white">Lỗi Tìm Kiếm</span>
              <span className="text-[11px] font-black italic uppercase tracking-[0.1em] text-white/40">Không tìm thấy phim, vui lòng thử lại!</span>
            </div>
          </div>
          <button onClick={() => setShow(false)} className="text-white/20 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
