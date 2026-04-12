import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { TOPXX_PATH } from "@/lib/constants";
import { TopXXClientShell } from "@/components/layout/TopXXClientShell";

export default function TopXXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-xx min-h-screen bg-background text-foreground">
      {/* 18+ Warning Banner — renders immediately, no JS needed */}
      <div className="bg-amber-500 text-black py-2 px-4 flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest z-[1100] relative">
        <AlertCircle className="w-4 h-4" />
        Nội dung 18+ - Chỉ dành cho người lớn - Cân nhắc trước khi xem
      </div>

      {/* TopXXClientShell handles: header nav, auth state, theme sync */}
      <TopXXClientShell>
        {children}
      </TopXXClientShell>
    </div>
  );
}
