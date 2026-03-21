import { MovieRowSkeleton } from "@/components/movie/MovieSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 mt-16 flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
      </div>
      
      <MovieRowSkeleton count={6} />
      <MovieRowSkeleton count={6} />
      <MovieRowSkeleton count={6} />
    </div>
  );
}
