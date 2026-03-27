// src/app/(topxx)/${TOPXX_PATH}/phim/[slug]/page.tsx
import { redirect } from "next/navigation";
import { TOPXX_PATH } from "@/lib/constants";

export default async function XXMovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return redirect(`/xem/${slug}`);
}
