"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-surface p-10 rounded-[40px] border border-white/10 shadow-2xl w-full max-w-sm relative flex flex-col gap-8 animate-in zoom-in duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-xl"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>
        
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20">
             <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
             </svg>
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">THAM GIA NGAY</h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 leading-relaxed">Đăng nhập để lưu phim yêu thích & đồng bộ lịch sử xem trên mọi thiết bị.</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-2">
          <Button 
            onClick={() => { 
              loginWithGoogle()
                .then(onClose)
                .catch((err: any) => {
                  console.error(err);
                  alert("Lỗi đăng nhập Firebase: " + (err.message || "Unknown error"));
                }); 
            }} 
            size="lg" 
            className="w-full h-16 bg-white text-black hover:bg-gray-100 text-sm font-black rounded-3xl gap-4 shadow-2xl hover:scale-[1.03] transition-all duration-500 active:scale-95 group"
          >
            <svg className="w-6 h-6 transform group-hover:rotate-[360deg] transition-transform duration-700" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
            TIẾP TỤC VỚI GOOGLE
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
