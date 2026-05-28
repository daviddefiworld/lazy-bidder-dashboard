import { DEFAULT_POSTED_WITHIN } from '../components/crawl/JobsFilterBar';
import type { ListViewLayout } from '../components/crawl/listPageStyles';
import { parseListView } from '../components/crawl/listPageStyles';
import type { JobListSort } from '../types/crawl';
import { resolvePostedFilter } from './postedFilterPreference';

export const JOBS_LIST_PREFERENCES_KEY = 'lazybidder_jobs_list_prefs';

export type JobsListPreferences = {
  q: string;
  skills: string;
  sort: JobListSort;
  posted: string;
  view: ListViewLayout;
};

function parseSort(raw: unknown): JobListSort {
  if (raw === 'relevant' || raw === 'title' || raw === 'fit_score') return raw;
  if (raw === 'date') return 'date';
  return 'fit_score';
}

function parsePosted(raw: unknown): string {
  return resolvePostedFilter(new URLSearchParams(), typeof raw === 'string' ? raw : undefined);
}

export function jobsUrlHasExplicitFilters(params: URLSearchParams): boolean {
  if (params.get('q')?.trim()) return true;
  if (params.get('skills')?.trim()) return true;
  if (params.has('sort')) return true;
  if (params.has('view')) return true;
  const page = params.get('page');
  if (page && page !== '1') return true;
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

function sortFromUrl(params: URLSearchParams): JobListSort | null {
  if (!params.has('sort')) return null;
  const sortRaw = params.get('sort')?.toLowerCase();
  if (sortRaw === 'relevant') return 'relevant';
  if (sortRaw === 'title') return 'title';
  if (sortRaw === 'date') return 'date';
  return 'fit_score';
}

/** Read sort from URL; missing param means default fit_score. */
export function resolveJobsSort(params: URLSearchParams): JobListSort {
  return sortFromUrl(params) ?? 'fit_score';
}

export function mergeJobsUrlWithPreferences(params: URLSearchParams): JobsListPreferences {
  const stored = readJobsListPreferences();
  const q = params.get('q') ?? '';
  const skills = params.get('skills') ?? '';
  const sort = resolveJobsSort(params);
  const posted = resolvePostedFilter(params, stored?.posted);
  const view = parseListView(params.get('view'), 'list');

  if (jobsUrlHasExplicitFilters(params)) {
    return { q, skills, sort, posted, view };
  }

  if (!stored) {
    return { q, skills, sort, posted, view };
  }

  return {
    q: stored.q,
    skills: stored.skills,
    sort: stored.sort,
    posted,
    view: stored.view
  };
}

/** True when any filter differs from page defaults (for Clear button). */
export function jobsFiltersDifferFromDefaults(filters: {
  q: string;
  skills: string;
  posted: string;
  sort: JobListSort;
}): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.skills.trim() ||
      filters.posted !== DEFAULT_POSTED_WITHIN ||
      filters.sort !== 'fit_score'
  );
}
