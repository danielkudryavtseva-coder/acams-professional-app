/** Placeholder hero imagery keyed by post id for stable thumbnails. */
export function getNewsCoverSrc(
  postId: string,
  width = 960,
  height = 640,
): string {
  return `https://picsum.photos/seed/${encodeURIComponent(postId)}/${width}/${height}`;
}

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatNewsShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
