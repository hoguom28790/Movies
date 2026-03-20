import { getTopXXDetails } from "@/services/api/topxx";
import { notFound } from "next/navigation";
import XXMovieDetailClient from "@/components/movie/XXMovieDetailClient";

export const dynamic = "force-dynamic";

export default async function XXMovieDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ play?: string }>
}) {
  const { slug } = await params;
  const { play } = await searchParams;
  
  let item;
  if (slug.startsWith("av-")) {
    const { getAVDBDetails } = await import("@/services/api/avdb");
    item = await getAVDBDetails(slug.replace("av-", ""));
  } else {
    item = await getTopXXDetails(slug);
  }

  if (!item) return notFound();

  return <XXMovieDetailClient item={item} slug={slug} autoPlay={play === "true"} />;
}
