import { DEFAULT_POSTED_WITHIN, POSTED_WITHIN_OPTIONS } from '../components/crawl/JobsFilterBar';

const POSTED_VALUES = new Set<string>(POSTED_WITHIN_OPTIONS.map((o) => o.value));

/** Prefer localStorage when URL only has the default posted window (or omits posted). */
export function resolvePostedFilter(
  params: URLSearchParams,
  storedPosted: string | undefined
): string {
  const urlHasPosted = params.has('posted');
  const urlPosted = urlHasPosted ? (params.get('posted') ?? '') : null;

  if (urlPosted != null && urlPosted !== DEFAULT_POSTED_WITHIN) {
    return urlPosted;
  }

  if (storedPosted !== undefined && POSTED_VALUES.has(storedPosted)) {
    return storedPosted;
  }

  if (urlHasPosted) {
    return urlPosted ?? DEFAULT_POSTED_WITHIN;
  }

  return DEFAULT_POSTED_WITHIN;
}

export function writePostedParam(next: URLSearchParams, posted: string): void {
  if (posted === DEFAULT_POSTED_WITHIN) {
    next.delete('posted');
  } else {
    next.set('posted', posted);
  }
}
