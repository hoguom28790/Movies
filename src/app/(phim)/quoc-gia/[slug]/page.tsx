import { getCountryMovies } from "@/services/api/category";
import { MovieGrid } from "@/components/phim/MovieGrid";
import { MovieListResponse } from "@/types/movie";
import { notFound } from "next/navigation";

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  const countryLabels: Record<string, string> = {
    "viet-nam": "Việt Nam",
    "trung-quoc": "Trung Quốc",
    "han-quoc": "Hàn Quốc",
    "nhat-ban": "Nhật Bản",
    "my": "Mỹ",
    "thai-lan": "Thái Lan",
    "an-do": "Ấn Độ",
    "dai-loan": "Đài Loan",
    "hong-kong": "Hồng Kông",
    "au-my": "Âu Mỹ",
    "anh": "Anh",
    "phap": "Pháp",
    "duc": "Đức",
    "tay-ban-nha": "Tây Ban Nha",
    "tho-nhi-ky": "Thổ Nhĩ Kỳ",
    "ha-lan": "Hà Lan",
    "indonesia": "Indonesia",
    "nga": "Nga",
    "mexico": "Mexico",
    "ba-lan": "Ba Lan",
    "uc": "Úc",
    "thuy-dien": "Thụy Điển",
  };

  const formatCountryName = (s: string) =>
    countryLabels[s] || s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  let result;
  try {
    result = await getCountryMovies(slug, currentPage);
  } catch (error) {
    console.error("Fetch Country Movies Error:", error);
    return notFound();
  }

  if (!result.items.length && currentPage === 1) return notFound();

  return (
    <MovieGrid
      movies={result.items}
      title={`Quốc Gia: ${formatCountryName(slug)}`}
      fetchUrl={`/api/movies?type=country&slug=${slug}`}
      currentPage={result.pagination.currentPage}
      totalPages={result.pagination.totalPages}
    />
  );
}
