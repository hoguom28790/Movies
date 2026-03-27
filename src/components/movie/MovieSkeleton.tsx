import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function MovieCardSkeleton({ isXX = false }: { isXX?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton 
        className={cn(
          "w-full rounded-[16px]", 
          isXX ? "aspect-[7/10]" : "aspect-[2/3]"
        )} 
      />
      <div className="px-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full opacity-50" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 12, isXX = false }: { count?: number, isXX?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} isXX={isXX} />
      ))}
    </div>
  );
}

export function MovieRowSkeleton({ count = 8, isXX = false }: { count?: number, isXX?: boolean }) {
  return (
    <div className="flex gap-4 md:gap-6 overflow-hidden px-6 lg:px-12">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "flex-shrink-0", 
            isXX ? "w-[160px] md:w-[220px]" : "w-[150px] sm:w-[180px] md:w-[200px]"
          )}
        >
          <MovieCardSkeleton isXX={isXX} />
        </div>
      ))}
    </div>
  );
}
