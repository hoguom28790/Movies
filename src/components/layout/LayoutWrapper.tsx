"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncCallbackHandler } from "@/components/auth/SyncCallbackHandler";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/topxx");

  return (
    <div className="min-h-screen flex flex-col">
      <SyncCallbackHandler />
      <main className={`flex-grow pb-safe ${!isXX ? "pt-[64px]" : ""}`}>
        {children}
      </main>
      {!isXX && <BottomNav />}
    </div>
  );
}
