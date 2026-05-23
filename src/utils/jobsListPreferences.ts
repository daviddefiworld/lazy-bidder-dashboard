import { DEFAULT_POSTED_WITHIN, POSTED_WITHIN_OPTIONS } from '../components/crawl/JobsFilterBar';
import type { ListViewLayout } from '../components/crawl/listPageStyles';
import { parseListView } from '../components/crawl/listPageStyles';
import type { JobListSort } from '../types/crawl';

export const JOBS_LIST_PREFERENCES_KEY = 'lazybidder_jobs_list_prefs';

export type JobsListPreferences = {
  q: string;
  skills: string;
  sort: JobListSort;
  posted: string;
  view: ListViewLayout;
};

const POSTED_VALUES = new Set<string>(POSTED_WITHIN_OPTIONS.map((o) => o.value));

function parseSort(raw: unknown): JobListSort {
  if (raw === 'relevant' || raw === 'title') return raw;
  return 'date';
}

function parsePosted(raw: unknown): string {
  if (typeof raw === 'string' && POSTED_VALUES.has(raw)) {
    return raw;
  }
  return DEFAULT_POSTED_WITHIN;
}

export function jobsUrlHasExplicitFilters(params: URLSearchParams): boolean {
  if (params.get('q')?.trim()) return true;
  if (params.get('skills')?.trim()) return true;
  if (params.has('sort')) return true;
  if (params.has('view')) return true;
  const page = params.get('page');
  if (page && page !== '1') return true;
  const posted = params.get('posted');
  if (posted != null && posted !== '' && posted !== DEFAULT_POSTED_WITHIN) return true;
  return false;
}

export function readJobsListPreferences(): JobsListPreferences | null {
  try {
    const raw = localStorage.getItem(JOBS_LIST_PREFERENCES_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      q: typeof data.q === 'string' ? data.q : '',
      skills: typeof data.skills === 'string' ? data.skills : '',
      sort: parseSort(data.sort),
      posted: parsePosted(data.posted),
      view: parseListView(typeof data.view === 'string' ? data.view : null, 'list')
    };
  } catch {
    return null;
  }
}

export function saveJobsListPreferences(prefs: JobsListPreferences): void {
  try {
    localStorage.setItem(JOBS_LIST_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / quota */
  }
}

export function mergeJobsUrlWithPreferences(params: URLSearchParams): JobsListPreferences {
  const q = params.get('q') ?? '';
  const skills = params.get('skills') ?? '';
  const sortRaw = params.get('sort')?.toLowerCase();
  const sort: JobListSort =
    sortRaw === 'relevant' ? 'relevant' : sortRaw === 'title' ? 'title' : 'date';
  const posted = params.has('posted') ? (params.get('posted') ?? DEFAULT_POSTED_WITHIN) : DEFAULT_POSTED_WITHIN;
  const view = parseListView(params.get('view'), 'list');

  if (jobsUrlHasExplicitFilters(params)) {
    return { q, skills, sort, posted, view };
  }

  const stored = readJobsListPreferences();
  if (!stored) {
    return { q, skills, sort, posted, view };
  }

  return {
    q: stored.q,
    skills: stored.skills,
    sort: stored.sort,
    posted: stored.posted,
    view: stored.view
  };
}
