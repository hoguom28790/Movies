import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Separated Phim and Truyen using route groups for independent layouts & navbars
export default function PhimLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-phim">
      <Navbar mode="phim" />
      <div className="pt-safe">
        {children}
      </div>
      <Footer />
    </div>
  );
}
