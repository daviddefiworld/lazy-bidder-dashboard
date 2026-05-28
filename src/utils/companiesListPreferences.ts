import { DEFAULT_POSTED_WITHIN } from '../components/crawl/JobsFilterBar';
import type { ListViewLayout } from '../components/crawl/listPageStyles';
import { parseListView } from '../components/crawl/listPageStyles';
import type { CompanyIgnoredFilter, CompanyListSort, ListSortOrder } from '../types/crawl';
import { resolvePostedFilter, writePostedParam } from './postedFilterPreference';

export const COMPANIES_LIST_PREFERENCES_KEY = 'lazybidder_companies_list_prefs';

const DEFAULT_VIEW: ListViewLayout = 'cards';

export type CompaniesListPreferences = {
  q: string;
  posted: string;
  ignored: CompanyIgnoredFilter;
  sort: CompanyListSort;
  order: ListSortOrder;
  view: ListViewLayout;
};

function parsePosted(raw: unknown): string {
  return resolvePostedFilter(new URLSearchParams(), typeof raw === 'string' ? raw : undefined);
}

function parseIgnored(raw: unknown): CompanyIgnoredFilter {
  if (raw === 'only' || raw === 'all') return raw;
  return 'hide';
}

function parseSort(raw: unknown): CompanyListSort {
  if (raw === 'jobs' || raw === 'founded' || raw === 'updated') return raw;
  return 'fit_score';
}

function parseOrder(raw: unknown): ListSortOrder {
  return raw === 'asc' ? 'asc' : 'desc';
}

export function companiesUrlHasExplicitFilters(params: URLSearchParams): boolean {
  if (params.get('q')?.trim()) return true;
  if (params.has('ignored')) return true;
  if (params.has('sort')) return true;
  if (params.has('order')) return true;
  if (params.has('view')) return true;
  const page = params.get('page');
  if (page && page !== '1') return true;
  return false;
}

export function readCompaniesListPreferences(): CompaniesListPreferences | null {
  try {
    const raw = localStorage.getItem(COMPANIES_LIST_PREFERENCES_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      q: typeof data.q === 'string' ? data.q : '',
      posted: parsePosted(data.posted),
      ignored: parseIgnored(data.ignored),
      sort: parseSort(data.sort),
      order: parseOrder(data.order),
      view: parseListView(typeof data.view === 'string' ? data.view : null, DEFAULT_VIEW)
    };
  } catch {
    return null;
  }
}

export function saveCompaniesListPreferences(prefs: CompaniesListPreferences): void {
  try {
    localStorage.setItem(COMPANIES_LIST_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode / quota */
  }
}

function readFromUrl(params: URLSearchParams, stored?: CompaniesListPreferences | null): CompaniesListPreferences {
  return {
    q: params.get('q') ?? '',
    posted: resolvePostedFilter(params, stored?.posted),
    ignored: resolveCompaniesIgnored(params, stored?.ignored),
    sort: resolveCompaniesSort(params),
    order: resolveCompaniesOrder(params),
    view: parseListView(params.get('view'), DEFAULT_VIEW)
  };
}

function sortFromUrl(params: URLSearchParams): CompanyListSort | null {
  if (!params.has('sort')) return null;
  return parseSort(params.get('sort'));
}

function orderFromUrl(params: URLSearchParams): ListSortOrder | null {
  if (!params.has('order')) return null;
  return parseOrder(params.get('order'));
}

/** Read sort from URL; missing param means default fit_score. */
export function resolveCompaniesSort(params: URLSearchParams): CompanyListSort {
  return sortFromUrl(params) ?? 'fit_score';
}

/** Read order from URL; missing param means default desc. */
export function resolveCompaniesOrder(params: URLSearchParams): ListSortOrder {
  return orderFromUrl(params) ?? 'desc';
}

export function resolveCompaniesIgnored(
  params: URLSearchParams,
  storedIgnored?: CompanyIgnoredFilter
): CompanyIgnoredFilter {
  if (params.has('ignored')) return parseIgnored(params.get('ignored'));
  if (!companiesUrlHasExplicitFilters(params) && storedIgnored) return storedIgnored;
  return 'hide';
}

export function mergeCompaniesUrlWithPreferences(params: URLSearchParams): CompaniesListPreferences {
  const stored = readCompaniesListPreferences();
  const fromUrl = readFromUrl(params, stored);
  if (companiesUrlHasExplicitFilters(params)) {
    return fromUrl;
  }
  return stored ? { ...stored, posted: fromUrl.posted } : fromUrl;
}

export type CompaniesUrlState = CompaniesListPreferences & { page: number };

export function readCompaniesUrlState(params: URLSearchParams): CompaniesUrlState {
  const stored = readCompaniesListPreferences();
  return {
    ...readFromUrl(params, stored),
    page: Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)
  };
}

export function writeCompaniesUrlState(state: CompaniesUrlState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.q.trim()) next.set('q', state.q.trim());
  writePostedParam(next, state.posted);
  if (state.ignored !== 'hide') next.set('ignored', state.ignored);
  next.set('sort', state.sort);
  if (state.order !== 'desc') next.set('order', state.order);
  if (state.view !== DEFAULT_VIEW) next.set('view', state.view);
  if (state.page > 1) next.set('page', String(state.page));
  return next;
}

/** True when any filter differs from page defaults (for Clear button). */
export function companiesFiltersDifferFromDefaults(filters: {
  q: string;
  posted: string;
  ignored: CompanyIgnoredFilter;
  sort: CompanyListSort;
  order: ListSortOrder;
}): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.posted !== DEFAULT_POSTED_WITHIN ||
      filters.ignored !== 'hide' ||
      filters.sort !== 'fit_score' ||
      filters.order !== 'desc'
  );
}
