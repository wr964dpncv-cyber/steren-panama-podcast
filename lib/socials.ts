export type Socials = {
  youtube?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  other?: string | null;
};

export function clean(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

// Normalize a handle/URL to a clickable href.
export function socialHref(platform: "youtube" | "instagram" | "tiktok" | "other", raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (platform === "other") {
    if (/^[\w.-]+\.[a-z]{2,}/i.test(v)) return `https://${v}`;
    return v;
  }
  const handle = v.replace(/^@/, "").replace(/\s+/g, "");
  if (platform === "youtube") return `https://www.youtube.com/@${handle}`;
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return v;
}

export function socialDisplay(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  // Strip protocol/www for compact display
  return v.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}
