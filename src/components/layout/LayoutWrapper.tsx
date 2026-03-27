"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncCallbackHandler } from "@/components/auth/SyncCallbackHandler";
import { useDevice } from "@/contexts/DeviceContext";
import { Suspense } from "react";
import { TOPXX_PATH } from "@/lib/constants";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isIPad } = useDevice();
  const isXX = pathname.startsWith(`/${TOPXX_PATH}`);

  return (
    <div className="min-h-screen flex flex-col">
      <SyncCallbackHandler />
      <main className="flex-grow pb-safe pt-[80px] lg:pt-0">
        {children}
      </main>
      {!isIPad && (
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      )}
    </div>
  );
}
