import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/crawl/EmptyState';
import PaginationBar from '../components/crawl/PaginationBar';
import RatingStars from '../components/crawl/RatingStars';
import { POSTED_WITHIN_OPTIONS } from '../components/crawl/JobsFilterBar';
import SearchField from '../components/crawl/SearchField';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import apiService from '../services/apiService';
import type {
  CompanyIgnoredFilter,
  CompanyListSort,
  IndeedCompany,
  ListSortOrder
} from '../types/crawl';
import { companyDetailPath } from '../utils/crawlUtils';
import { formatRelativeTime } from '../utils/formatters';

const PAGE_SIZE = 24;

function parseIgnoredFilter(raw: string | null): CompanyIgnoredFilter {
  if (raw === 'only' || raw === 'all') return raw;
  return 'hide';
}

function parseCompanySort(raw: string | null): CompanyListSort {
  if (raw === 'jobs' || raw === 'founded') return raw;
  return 'updated';
}

function parseSortOrder(raw: string | null): ListSortOrder {
  return raw === 'asc' ? 'asc' : 'desc';
}

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

const headerSelectClass =
  'rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

const iconBtnClass =
  'rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition';

const CompaniesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const postedParam = searchParams.get('posted') ?? '';
  const ignoredParam = parseIgnoredFilter(searchParams.get('ignored'));
  const sortParam = parseCompanySort(searchParams.get('sort'));
  const orderParam = parseSortOrder(searchParams.get('order'));
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(qParam);
  const [postedWithin, setPostedWithin] = useState(postedParam);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [items, setItems] = useState<IndeedCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = (pageParam - 1) * PAGE_SIZE;

  const syncUrl = useCallback(
    (
      q: string,
      page: number,
      ignored: CompanyIgnoredFilter,
      sort: CompanyListSort,
      order: ListSortOrder,
      posted: string
    ) => {
      const next = new URLSearchParams();
      if (q.trim()) next.set('q', q.trim());
      if (posted.trim()) next.set('posted', posted.trim());
      if (ignored !== 'hide') next.set('ignored', ignored);
      if (sort !== 'updated') next.set('sort', sort);
      if (order !== 'desc') next.set('order', order);
      if (page > 1) next.set('page', String(page));
      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const filtersChanged =
      debouncedSearch !== qParam || postedWithin !== postedParam;
    if (filtersChanged) {
      syncUrl(debouncedSearch, 1, ignoredParam, sortParam, orderParam, postedWithin);
    }
  }, [
    debouncedSearch,
    qParam,
    postedWithin,
    postedParam,
    ignoredParam,
    sortParam,
    orderParam,
    syncUrl
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const postedNum = postedParam ? parseInt(postedParam, 10) : undefined;
      const data = await apiService.listCrawlCompanies({
        limit: PAGE_SIZE,
        offset,
        search: qParam.trim() || undefined,
        ignored: ignoredParam,
        sort: sortParam,
        order: orderParam,
        posted_within: postedNum && postedNum > 0 ? postedNum : undefined
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load companies');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, qParam, postedParam, ignoredParam, sortParam, orderParam]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePageChange = (page: number) => {
    syncUrl(qParam, page, ignoredParam, sortParam, orderParam, postedParam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIgnoredFilterChange = (ignored: CompanyIgnoredFilter) => {
    syncUrl(qParam, 1, ignored, sortParam, orderParam, postedParam);
  };

  const handleSortChange = (sort: CompanyListSort) => {
    syncUrl(qParam, 1, ignoredParam, sort, orderParam, postedParam);
  };

  const handleOrderChange = (order: ListSortOrder) => {
    syncUrl(qParam, 1, ignoredParam, sortParam, order, postedParam);
  };

  const handlePostedWithinChange = (posted: string) => {
    setPostedWithin(posted);
    syncUrl(qParam, 1, ignoredParam, sortParam, orderParam, posted);
  };

  const clearPostedFilter = () => {
    setPostedWithin('');
    syncUrl(qParam, 1, ignoredParam, sortParam, orderParam, '');
  };

  const toggleSortOrder = () => {
    handleOrderChange(orderParam === 'desc' ? 'asc' : 'desc');
  };

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Companies</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Employer profiles from Indeed crawl data — ratings, size, open roles, and FAQs.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start">
          <select
            value={ignoredParam}
            onChange={(e) => handleIgnoredFilterChange(e.target.value as CompanyIgnoredFilter)}
            className={headerSelectClass}
            aria-label="Employer visibility"
          >
            <option value="hide">Active employers</option>
            <option value="only">Ignored only</option>
            <option value="all">All employers</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={iconBtnClass}
            aria-label="Refresh list"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="sticky top-[3.5rem] z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-slate-50/95 backdrop-blur border-b border-slate-200/80 sm:border-0 sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-200/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="companies-list-search" className="block text-xs font-medium text-slate-600 mb-1">
              Search
            </label>
            <SearchField
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Name, HQ, slug…"
              id="companies-list-search"
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-end gap-3">
            <div className="w-full sm:w-auto min-w-[10.5rem] sm:min-w-[11.5rem]">
              <label htmlFor="companies-posted" className="block text-xs font-medium text-slate-600 mb-1">
                Jobs posted
              </label>
              <select
                id="companies-posted"
                value={postedWithin}
                onChange={(e) => handlePostedWithinChange(e.target.value)}
                className={selectClass}
              >
                {POSTED_WITHIN_OPTIONS.map((o) => (
                  <option key={o.value || 'any'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="min-w-[9.5rem] sm:min-w-[10.5rem]">
                <label htmlFor="companies-sort" className="block text-xs font-medium text-slate-600 mb-1">
                  Sort
                </label>
                <select
                  id="companies-sort"
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value as CompanyListSort)}
                  className={selectClass}
                >
                  <option value="updated">Recently updated</option>
                  <option value="jobs">Job count</option>
                  <option value="founded">Founded</option>
                </select>
              </div>
              <button
                type="button"
                onClick={toggleSortOrder}
                aria-label={orderParam === 'desc' ? 'Descending (click for ascending)' : 'Ascending (click for descending)'}
                title={orderParam === 'desc' ? 'Descending' : 'Ascending'}
                className={`${iconBtnClass} mb-0.5 shrink-0 px-2.5`}
              >
                {orderParam === 'desc' ? <SortDescendingIcon /> : <SortAscendingIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title={
            qParam
              ? 'No companies match your search'
              : postedParam
                ? 'No companies with jobs in that period'
                : ignoredParam === 'only'
                  ? 'No ignored companies'
                  : 'No companies in the database yet'
          }
          description={
            qParam
              ? 'Try another keyword or clear the search.'
              : postedParam
                ? 'Try a wider posting window or clear the date filter.'
                : ignoredParam === 'only'
                  ? 'Mark employers as ignored from a company detail page.'
                  : 'POST crawled companies to /api/crawl/companies with your API key.'
          }
          action={
            qParam || postedParam ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {qParam ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="text-sm font-medium text-primary-700 hover:text-primary-800"
                  >
                    Clear search
                  </button>
                ) : null}
                {postedParam ? (
                  <button
                    type="button"
                    onClick={clearPostedFilter}
                    className="text-sm font-medium text-primary-700 hover:text-primary-800"
                  >
                    Clear date filter
                  </button>
                ) : null}
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <PaginationBar
              total={total}
              limit={PAGE_SIZE}
              offset={offset}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>

          <div
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {items.map((co) => (
              <CompanyCard key={`${co.platform}:${co.companypage}`} company={co} />
            ))}
          </div>

          <div className="mt-6">
            <PaginationBar
              total={total}
              limit={PAGE_SIZE}
              offset={offset}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>
        </>
      )}
    </main>
  );
};

const CompanyCard: React.FC<{ company: IndeedCompany }> = ({ company }) => {
  const to = companyDetailPath(company.platform, company.companypage);

  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-full"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-800 line-clamp-2">
              {company.company_name || 'Unnamed company'}
            </h3>
            {company.ignored ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Ignored
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 capitalize mt-0.5">{company.platform}</p>
        </div>
        {company.rating != null ? (
          <RatingStars rating={company.rating} reviewCount={company.review_count} />
        ) : null}
      </div>

      <div className="flex-1 space-y-2 text-sm text-slate-600">
        {company.headquarters ? (
          <p className="line-clamp-1" title={company.headquarters}>
            HQ: {company.headquarters}
          </p>
        ) : null}
        {company.employee_range ? <p>{company.employee_range} employees</p> : null}
        {company.founded ? <p>Founded {company.founded}</p> : null}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
        {company.jobs_count != null && company.jobs_count > 0 ? (
          <StatPill label="Jobs" value={company.jobs_count} />
        ) : null}
        {company.salaries_tab_count != null && company.salaries_tab_count > 0 ? (
          <StatPill label="Salaries" value={company.salaries_tab_count} />
        ) : null}
        {company.qa_tab_count != null && company.qa_tab_count > 0 ? (
          <StatPill label="Q&A" value={company.qa_tab_count} />
        ) : null}
      </div>

      {company.updatedAt ? (
        <p className="mt-3 text-[11px] text-slate-400">
          Updated {formatRelativeTime(company.updatedAt)}
        </p>
      ) : null}
    </Link>
  );
};

const StatPill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
    {label}: {value.toLocaleString()}
  </span>
);

const RefreshIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const SortDescendingIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m13.5 0v6.75m0 0-3-3m3 3 3-3M3 16.5h5.25"
    />
  </svg>
);

const SortAscendingIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m-9.75 3.75h9.75M12 4.5v15m0 0 3-3m-3 3-3-3"
    />
  </svg>
);

export default CompaniesPage;
