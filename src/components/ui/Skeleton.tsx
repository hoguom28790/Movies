import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-foreground/[0.03] rounded-2xl before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.03] before:to-transparent",
        className
      )}
    />
  );
}

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

export function MovieRowSkeleton({ isXX = false }: { isXX?: boolean }) {
  return (
    <div className="space-y-6 px-6 lg:px-12 py-8">
      <Skeleton className="h-8 w-48 rounded-full" />
      <div className="flex gap-4 md:gap-6 overflow-hidden">
        {[...Array(6)].map((_, i) => (
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
    </div>
  );
}
