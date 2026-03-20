"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isXX = pathname.startsWith("/xx");

  return (
    <div className="min-h-screen flex flex-col">
      {!isXX && <Navbar />}
      <main className={`flex-grow pb-safe ${!isXX ? "pt-14" : ""}`}>
        {children}
      </main>
      {!isXX && <Footer />}
    </div>
  );
}
