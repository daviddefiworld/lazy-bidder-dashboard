import { DEFAULT_POSTED_WITHIN, POSTED_WITHIN_OPTIONS } from '../components/crawl/JobsFilterBar';
import type { ListViewLayout } from '../components/crawl/listPageStyles';
import { parseListView } from '../components/crawl/listPageStyles';
import type { CompanyIgnoredFilter, CompanyListSort, ListSortOrder } from '../types/crawl';

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

const POSTED_VALUES = new Set<string>(POSTED_WITHIN_OPTIONS.map((o) => o.value));

function parsePosted(raw: unknown): string {
  if (typeof raw === 'string' && POSTED_VALUES.has(raw)) {
    return raw;
  }
  return DEFAULT_POSTED_WITHIN;
}

function parseIgnored(raw: unknown): CompanyIgnoredFilter {
  if (raw === 'only' || raw === 'all') return raw;
  return 'hide';
}

function parseSort(raw: unknown): CompanyListSort {
  if (raw === 'jobs' || raw === 'founded' || raw === 'fit_score') return raw;
  return 'updated';
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
  const posted = params.get('posted');
  if (posted != null && posted !== '' && posted !== DEFAULT_POSTED_WITHIN) return true;
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

function readFromUrl(params: URLSearchParams): CompaniesListPreferences {
  const sortRaw = params.get('sort');
  return {
    q: params.get('q') ?? '',
    posted: params.has('posted') ? (params.get('posted') ?? DEFAULT_POSTED_WITHIN) : DEFAULT_POSTED_WITHIN,
    ignored: parseIgnored(params.get('ignored')),
    sort: parseSort(sortRaw),
    order: parseOrder(params.get('order')),
    view: parseListView(params.get('view'), DEFAULT_VIEW)
  };
}

export function mergeCompaniesUrlWithPreferences(params: URLSearchParams): CompaniesListPreferences {
  const fromUrl = readFromUrl(params);
  if (companiesUrlHasExplicitFilters(params)) {
    return fromUrl;
  }
  const stored = readCompaniesListPreferences();
  return stored ?? fromUrl;
}

export type CompaniesUrlState = CompaniesListPreferences & { page: number };

export function readCompaniesUrlState(params: URLSearchParams): CompaniesUrlState {
  return {
    ...readFromUrl(params),
    page: Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)
  };
}

export function writeCompaniesUrlState(state: CompaniesUrlState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.q.trim()) next.set('q', state.q.trim());
  next.set('posted', state.posted);
  if (state.ignored !== 'hide') next.set('ignored', state.ignored);
  if (state.sort !== 'updated') next.set('sort', state.sort);
  if (state.order !== 'desc') next.set('order', state.order);
  if (state.view !== DEFAULT_VIEW) next.set('view', state.view);
  if (state.page > 1) next.set('page', String(state.page));
  return next;
}
