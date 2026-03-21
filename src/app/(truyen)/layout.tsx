import { StitchNavbar } from "@/components/stitch/StitchNavbar";
import { StitchFooter } from "@/components/stitch/StitchFooter";
import { StitchBottomBar } from "@/components/stitch/StitchBottomBar";

export default function TruyenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-truyen bg-surface min-h-screen font-body text-on-surface">
      <StitchNavbar />
      <div className="md:pt-0">
        {children}
      </div>
      <StitchFooter />
      <StitchBottomBar />
    </div>
  );
}
