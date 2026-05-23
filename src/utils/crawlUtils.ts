/** Turn mixed JSON array entries into display strings. */
export function jsonItemsToLabels(items: unknown[]): string[] {
  return items
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        const o = item as Record<string, unknown>;
        const label =
          o.label ?? o.name ?? o.title ?? o.text ?? o.value ?? o.attribute ?? o.benefit;
        if (label != null && String(label).trim()) return String(label).trim();
        return JSON.stringify(item);
      }
      return String(item);
    })
    .filter(Boolean);
}

export function formatRating(rating: number | null | undefined): string {
  if (rating == null || !Number.isFinite(rating)) return '—';
  return rating.toFixed(1);
}

export function companyDetailPath(platform: string, companypage: string): string {
  const params = new URLSearchParams({
    platform,
    companypage
  });
  return `/companies/detail?${params.toString()}`;
}

export function jobDetailPath(jobId: string): string {
  return `/jobs/${encodeURIComponent(jobId)}`;
}

/** Escape special regex characters in user search input. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function countSearchMatches(text: string, query: string): number {
  if (!query.trim() || !text) return 0;
  const re = new RegExp(escapeRegex(query.trim()), 'gi');
  return [...text.matchAll(re)].length;
}
