import { randomUUID } from "node:crypto";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeEntityKey(prefix: string) {
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export function makeSlugWithSuffix(value: string) {
  const base = slugify(value);
  if (!base) {
    return "";
  }

  return `${base}-${randomUUID().replace(/-/g, "").slice(0, 6).toLowerCase()}`;
}
