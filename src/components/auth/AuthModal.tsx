"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithGoogle } = useAuth();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-xl border border-white/10 shadow-2xl w-full max-w-sm relative flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white pb-2 px-2 text-2xl leading-none font-bold">&times;</button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-primary uppercase">Đăng Nhập</h2>
          <p className="text-sm text-neutral-400 mt-2">Dành cho tính năng Danh sách Phim & Lịch sử Xem.</p>
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
            className="w-full h-14 bg-white text-black hover:bg-gray-100 text-lg font-black rounded-full gap-3 shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.7)] hover:scale-105 transition-all duration-300 ring-4 ring-white/20"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
            TIẾP TỤC VỚI GOOGLE
          </Button>
        </div>
      </div>
    </div>
  );
}
