"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/topxx");

  return (
    <div className="min-h-screen flex flex-col">
      {!isXX && <Navbar />}
      <main className={`flex-grow pb-safe ${!isXX ? "pt-[64px]" : ""}`}>
        {children}
      </main>
      {!isXX && <BottomNav />}
      {!isXX && <Footer />}
      {!isXX && <Sidebar hideDesktop />}
    </div>
  );
}
