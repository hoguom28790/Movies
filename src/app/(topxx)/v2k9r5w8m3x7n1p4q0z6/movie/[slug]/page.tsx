// src/app/(topxx)/${TOPXX_PATH}/movie/[slug]/page.tsx
import { redirect } from "next/navigation";
import { TOPXX_PATH } from "@/lib/constants";

export default async function XXMovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return redirect(`/${TOPXX_PATH}/watch/${slug}`);
}
