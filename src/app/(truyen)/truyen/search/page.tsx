import { ComicCard } from "@/components/comic/ComicCard";
import Form from "next/form";
import Link from "next/link";
import { Search, Filter, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tìm Kiếm Truyện - Hồ Truyện",
  description: "Tìm kiếm truyện tranh tại Hồ Truyện",
};

async function searchComics(query: string, page: number = 1) {
  try {
    const res = await fetch(`https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&page=${page}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, domainCdn: "" };
    
    const data = await res.json();
    const domainCdn = data?.data?.APP_DOMAIN_CDN_IMAGE || "https://otruyenapi.com/uploads/comics";
    const items = data?.data?.items || [];
    const pagination = data?.data?.params?.pagination || { totalItems: 0, totalItemsPerPage: 24, currentPage: 1 };
    const totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) || 1;

    return { 
      items, 
      totalItems: pagination.totalItems,
      totalPages,
      currentPage: pagination.currentPage,
      domainCdn 
    };
  } catch (error) {
    console.error("Comic search failed:", error);
    return { items: [], totalItems: 0, totalPages: 1, currentPage: 1, domainCdn: "" };
  }
}

export default async function ComicSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  let results: Awaited<ReturnType<typeof searchComics>> = { 
    items: [], 
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    domainCdn: ""
  };

  if (query) {
    results = await searchComics(query, currentPage);
  }

  return (
    <div className="container mx-auto px-4 lg:px-12 py-8 mt-16 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Search Header */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <h1 className="text-xl md:text-2xl font-semibold text-white/90 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Tìm Kiếm Truyện Tranh
          </h1>

          <Form action="/truyen/search" className="relative group">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Tên truyện, tác giả..."
              className="w-full h-12 rounded-xl bg-white/5 border border-white/[0.08] px-4 pr-16 text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.08] transition-all placeholder:text-white/25"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-primary hover:bg-primary-hover shadow-lg shadow-indigo-500/20 text-white text-[12px] font-bold transition-all"
            >
              Tìm Truyện
            </button>
          </Form>

          {/* Filters Suggestion */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
             <Link href="/truyen" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] hover:bg-white/10 text-[11px] sm:text-[12px] text-white/60 transition-colors">
               <Filter className="w-3 h-3" />
               Bộ lọc Thể loại
             </Link>
             <span className="text-[11px] text-white/30 italic ml-2">Bạn có thể lọc truyện bằng thanh công cụ ở Navbar.</span>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col gap-8">
          {query && (
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white/80">
                Kết quả cho: <span className="text-indigo-400">"{query}"</span>
              </h2>
              <span className="text-sm font-semibold text-white/40">
                Tìm thấy {results.totalItems} kết quả
              </span>
            </div>
          )}

          {results.items.length > 0 ? (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {results.items.map((comic: any) => (
                <ComicCard
                  key={comic._id}
                  title={comic.name}
                  slug={comic.slug}
                  posterUrl={`${results.domainCdn}/uploads/comics/${comic.thumb_url}`}
                  latestChapter={comic.chaptersLatest?.[0]?.chapter_name ? `Ch. ${comic.chaptersLatest[0].chapter_name}` : ""}
                  originalTitle={comic.origin_name?.[0] || ""}
                />
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Search className="w-10 h-10 text-white/20" />
              </div>
              <p className="text-lg text-white/40 font-medium">
                Không tìm thấy truyện nào phù hợp với từ khóa <br />
                <span className="text-white/60">"{query}"</span>
              </p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-white/40 font-medium">Hãy nhập tên truyện để bắt đầu tìm kiếm.</p>
            </div>
          )}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/truyen/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:text-white transition-all shadow-lg"
                >
                  <span className="md:hidden">←</span>
                  <span className="hidden md:inline">← Trang trước</span>
                </Link>
              )}
              <div className="px-3 py-2 rounded-lg bg-white/5 text-[13px] font-bold text-white/40">
                <span className="text-white">{currentPage}</span> / {results.totalPages}
              </div>
              {currentPage < results.totalPages && (
                <Link
                  href={`/truyen/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:text-white transition-all shadow-lg"
                >
                  <span className="md:hidden">→</span>
                  <span className="hidden md:inline">Trang tiếp →</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
