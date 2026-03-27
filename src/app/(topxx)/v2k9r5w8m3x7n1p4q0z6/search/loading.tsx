import React from "react";
import { MovieCardSkeleton } from "@/components/movie/MovieSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TopXXSearchLoading() {
  return (
    <div className="min-h-screen px-6 lg:px-12 py-20 flex flex-col gap-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-l-4 border-yellow-500 pl-8">
        <Skeleton className="h-10 w-96 rounded-full bg-yellow-500/10" />
        <Skeleton className="h-4 w-48 rounded-full bg-white/5 opacity-30" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 md:gap-12 w-full">
        {[...Array(12)].map((_, i) => (
          <MovieCardSkeleton key={i} isXX={true} />
        ))}
      </div>
    </div>
  );
}
