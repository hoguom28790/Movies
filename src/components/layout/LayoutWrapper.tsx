"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncCallbackHandler } from "@/components/auth/SyncCallbackHandler";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/v2k9r5w8m3x7n1p4q0z6");

  return (
    <div className="min-h-screen flex flex-col">
      <SyncCallbackHandler />
      <main className="flex-grow pb-safe pt-[64px] lg:pt-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
