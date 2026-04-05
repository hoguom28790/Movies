import { Suspense } from "react";
import { Loader2, User2 } from "lucide-react";
import { TOPXX_PATH } from "@/lib/constants";
import Link from "next/link";
import { ActorModal } from "@/components/movie/ActorModal";

// Client component handled within the same file for simplicity since it's a specific listing
import { ActorsStyleListing } from "./listing";

export const dynamic = "force-dynamic";

export default async function ActorsStylePage({ 
  params 
}: { 
  params: Promise<{ style: string }> 
}) {
  const { style } = await params;
  const decodedStyle = decodeURIComponent(style);

  return (
    <div className="container mx-auto px-4 py-20 min-h-screen">
      <div className="flex flex-col gap-4 mb-20 max-w-4xl">
        <div className="flex items-center gap-4">
           <div className="h-px flex-1 bg-yellow-500/20" />
           <span className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-[0.3em] italic rounded">Premium Artists</span>
           <div className="h-px flex-1 bg-yellow-500/20" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-foreground uppercase tracking-tighter italic text-center leading-none">
          {decodedStyle} <span className="text-yellow-500">Models</span>
        </h1>
        <p className="text-foreground/20 text-xs font-black uppercase tracking-[0.5em] italic text-center">
          Elite collection of {decodedStyle} style actresses
        </p>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <Loader2 className="w-16 h-16 text-yellow-500/20 animate-spin" />
          <p className="text-foreground/10 text-[10px] font-black uppercase tracking-[0.8em] italic">Synchronizing Elite Talent...</p>
        </div>
      }>
        <ActorsStyleListing style={decodedStyle} />
      </Suspense>
    </div>
  );
}

function ActorsStyleListing({ style }: { style: string }) {
  // This is a placeholder for the client component that will fetch and display
  return <ActorsStyleClient style={style} />;
}

import { ActorsStyleClient } from "./client";
