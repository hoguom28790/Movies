import { getGenreList } from "@/services/api/category";
import { LayoutGrid } from "lucide-react";
import { GenreGrid } from "@/components/movie/GenreGrid";

export default async function TheLoaiPage() {
  const genres = await getGenreList();

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 mt-16 min-h-[70vh]">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-primaryxl md:text-4xl font-black text-white flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary" />
          Tất Cả Thể Loại
        </h1>
        <p className="text-white/40 font-medium max-w-lg">
          Khám phá kho tàng phim đồ sộ được phân loại theo từng sở thích riêng biệt của bạn.
        </p>
      </div>

      <GenreGrid genres={genres} />
    </div>
  );
}
