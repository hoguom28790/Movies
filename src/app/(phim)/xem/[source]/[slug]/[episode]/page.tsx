import { redirect } from "next/navigation";

export default async function WatchRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ source: string; slug: string; episode: string }>;
  searchParams: Promise<{ sv?: string }>;
}) {
  const [{ source, slug, episode }, { sv }] = await Promise.all([params, searchParams]);
  return redirect(`/xem/${slug}?src=${source}&ep=${encodeURIComponent(episode)}&sv=${sv || "0"}`);
}
