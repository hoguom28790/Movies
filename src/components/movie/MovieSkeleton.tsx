export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
      <div className="h-4 rounded bg-white/5 w-3/4 mx-1" />
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MovieRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px] animate-pulse">
          <div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
          <div className="h-4 rounded bg-white/5 w-3/4 mt-3 mx-1" />
        </div>
      ))}
    </div>
  );
}
