// src/app/(topxx)/v2k9r5w8m3x7n1p4q0z6/phim/[slug]/page.tsx
import { redirect } from "next/navigation";

export default async function XXMovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return redirect(`/xem/${slug}`);
}
