import React from "react";
import { XXNav } from "@/components/layout/XXNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { XXFooter } from "@/components/layout/XXFooter";
import { XXSyncManager } from "@/components/layout/XXSyncManager";

export default function XXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <XXSyncManager />
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-[72px]">
        <header className="fixed top-0 z-[1000] w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300 pt-safe lg:pr-[72px]">
          <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
            <XXNav />
          </div>
        </header>
        <main className="flex-grow pt-20 pb-safe px-4 lg:px-12">
          {children}
        </main>
        <XXFooter />
      </div>
    </div>
  );
}
