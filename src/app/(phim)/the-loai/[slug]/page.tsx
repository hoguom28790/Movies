import { getGenreMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/phim/MovieGrid";
import { MovieListResponse } from "@/types/movie";
import { notFound } from "next/navigation";

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const genreLabels: Record<string, string> = {
    "hanh-dong": "Hành Động",
    "tinh-cam": "Tình Cảm",
    "hai-huoc": "Hài Hước",
    "co-trang": "Cổ Trang",
    "tam-ly": "Tâm Lý",
    "kinh-di": "Kinh Dị",
    "vien-tuong": "Viễn Tưởng",
    "phieu-luu": "Phiêu Lưu",
    "hoat-hinh": "Hoạt Hình",
    "tai-lieu": "Tài Liệu",
    "xa-hoi-den": "Xã Hội Đen",
    "bi-an": "Bí Ẩn",
    "chien-tranh": "Chiến Tranh",
    "the-thao": "Thể Thao",
    "the-thao-am-nhac": "Âm Nhạc",
    "gia-dinh": "Gia Đình",
    "chieu-rap": "Phim Chiếu Rạp",
    "long-tieng": "Phim Lồng Tiếng",
    "thuyet-minh": "Phim Thuyết Minh",
  };

  const collectionSlugs = ["chieu-rap", "long-tieng", "thuyet-minh"];
  const isCollection = collectionSlugs.includes(slug);

  const formatGenreName = (s: string) =>
    genreLabels[s] || s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  let result: MovieListResponse = { items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  try {
    if (isCollection) {
      const { getCategoryMovies } = await import("@/services/api/category");
      result = await getCategoryMovies(slug, currentPage);
    } else {
      result = await getGenreMovies(slug, currentPage);
    }
  } catch (error) {
    console.error("Fetch Genre Movies Error:", error);
  }
 
  if (!result.items.length && currentPage === 1 && !genreLabels[slug] && !collectionSlugs.includes(slug)) return notFound();

  return (
    <MovieGrid
      movies={result.items}
      title={`Thể Loại: ${formatGenreName(slug)}`}
      fetchUrl={`/api/movies?type=genre&slug=${slug}`}
      currentPage={result.pagination.currentPage}
      totalPages={result.pagination.totalPages}
    />
  );
}
