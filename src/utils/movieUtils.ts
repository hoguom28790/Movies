export function normalizeMovieTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Remove duplicate hyphens
}

export function extractYear(title: string): string | null {
  const match = title.match(/\((19|20)\d{2}\)/) || title.match(/\s(19|20)\d{2}/);
  return match ? match[0].replace(/[()]/g, "").trim() : null;
}

export function cleanTitle(title: string): string {
  // Remove year and extra tags like [Thuyết Minh] or (2024)
  return title
    .replace(/\((19|20)\d{2}\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();
}
