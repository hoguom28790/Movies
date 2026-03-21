"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/topxx");

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-grow pb-safe ${!isXX ? "pt-[64px]" : ""}`}>
        {children}
      </main>
      {!isXX && <BottomNav />}
      {!isXX && <Sidebar />}
    </div>
  );
}
