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

export type CompanyDetailLinkOpts = {
  companypage?: string | null;
  company_name?: string | null;
};

/** Company detail URL — prefers slug when present, otherwise links by company name. */
export function companyDetailPath(platform: string, opts: CompanyDetailLinkOpts): string | null {
  const plat = platform?.trim();
  if (!plat) return null;

  const page = opts.companypage?.trim();
  const name = opts.company_name?.trim();
  const params = new URLSearchParams({ platform: plat });

  if (page) {
    params.set('companypage', page);
  } else if (name) {
    params.set('company_name', name);
  } else {
    return null;
  }

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
