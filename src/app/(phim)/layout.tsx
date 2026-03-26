import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Separated Phim and Truyen using route groups for independent layouts & navbars
export default function PhimLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-phim">
      <Suspense fallback={<div className="h-20" />}>
        <Navbar mode="phim" />
      </Suspense>
      <div className="pt-safe">
        {children}
      </div>
      <Footer />
    </div>
  );
}
