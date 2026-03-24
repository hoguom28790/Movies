// src/lib/normalize.ts
export const normalizeTitle = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const slugify = (str: string) => {
  return normalizeTitle(str).replace(/\s+/g, "-");
};
