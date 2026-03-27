import { MovieRowSkeleton } from "@/components/movie/MovieSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-16 pb-20 pt-16">
      {/* Hero Skeleton */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      <div className="flex flex-col gap-12">
        <div className="space-y-4 px-6 lg:px-12">
           <Skeleton className="h-10 w-64 rounded-full" />
           <Skeleton className="h-4 w-96 rounded-full opacity-30" />
        </div>
        
        <MovieRowSkeleton count={8} />
        <MovieRowSkeleton count={8} />
        <MovieRowSkeleton count={8} />
      </div>
    </div>
  );
}
