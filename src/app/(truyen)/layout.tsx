import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Separated Phim and Truyen using route groups for independent layouts & navbars
export default function TruyenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-truyen">
      <Navbar mode="truyen" />
      <div className="pt-safe">
        {children}
      </div>
      <Footer />
    </div>
  );
}
