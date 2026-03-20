import { getTopXXMovies } from "@/services/api/topxx";
import { XXMovieGrid } from "@/components/movie/XXMovieGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TopXX - Kho Phim Cao Cấp",
  description: "Trải nghiệm không gian phim giải trí đỉnh cao từ TopXX.",
};

export default async function XXHomePage() {
  const initialData = await getTopXXMovies(1);

  return (
    <div className="container mx-auto">
      <XXMovieGrid 
        initialMovies={initialData.items} 
        title="PHIM MỚI CẬP NHẬT" 
        fetchUrl="/api/xx?category=phim-moi-cap-nhat"
        initialPage={1}
        totalPages={initialData.pagination.totalPages}
      />
    </div>
  );
}
