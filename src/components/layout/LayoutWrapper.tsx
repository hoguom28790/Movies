"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/collection");

  return (
    <div className="min-h-screen flex flex-col">
      {!isXX && <Navbar />}
      <main className={`flex-grow pb-safe ${!isXX ? "pt-14 pb-20 md:pb-safe" : ""}`}>
        {children}
      </main>
      {!isXX && <Footer />}
      {!isXX && <Sidebar hideDesktop />}
    </div>
  );
}
