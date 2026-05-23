import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import CompaniesFilterBar from '../components/crawl/CompaniesFilterBar';
import EmptyState from '../components/crawl/EmptyState';
import { DEFAULT_POSTED_WITHIN } from '../components/crawl/JobsFilterBar';
import ListLayoutToggle from '../components/crawl/ListLayoutToggle';
import { RefreshIconButton } from '../components/crawl/ListPageIcons';
import PaginationBar from '../components/crawl/PaginationBar';
import RatingStars from '../components/crawl/RatingStars';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import apiService from '../services/apiService';
import type { IndeedCompany } from '../types/crawl';
import { companyDetailPath } from '../utils/crawlUtils';
import { formatRelativeTime } from '../utils/formatters';
import {
  headerSelectClass,
  stickyFilterPanelClass,
  type ListViewLayout
} from '../components/crawl/listPageStyles';
import {
  mergeCompaniesUrlWithPreferences,
  readCompaniesUrlState,
  saveCompaniesListPreferences,
  writeCompaniesUrlState,
  type CompaniesUrlState
} from '../utils/companiesListPreferences';
import type { CompanyIgnoredFilter, CompanyListSort, ListSortOrder } from '../types/crawl';

const PAGE_SIZE = 24;

function readInitialCompaniesFilters() {
  return mergeCompaniesUrlWithPreferences(new URLSearchParams(window.location.search));
}

const CompaniesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const url = readCompaniesUrlState(searchParams);

  const [searchInput, setSearchInput] = useState(() => readInitialCompaniesFilters().q);
  const [postedWithin, setPostedWithin] = useState(() => readInitialCompaniesFilters().posted);
  const [urlReady, setUrlReady] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [items, setItems] = useState<IndeedCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = (url.page - 1) * PAGE_SIZE;

  const syncUrl = useCallback(
    (state: CompaniesUrlState) => {
      setSearchParams(writeCompaniesUrlState(state), { replace: true });
    },
    [setSearchParams]
  );

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefs = mergeCompaniesUrlWithPreferences(params);
    const fromUrl = readCompaniesUrlState(params);

    setSearchInput(prefs.q);
    setPostedWithin(prefs.posted);

    const target: CompaniesUrlState = {
      ...prefs,
      page: fromUrl.page
    };
    const next = writeCompaniesUrlState(target);
    if (next.toString() !== params.toString()) {
      setSearchParams(next, { replace: true });
    }
    setUrlReady(true);
  }, [setSearchParams]);

  useEffect(() => {
    saveCompaniesListPreferences({
      q: url.q,
      posted: url.posted,
      ignored: url.ignored,
      sort: url.sort,
      order: url.order,
      view: url.view
    });
  }, [url.q, url.posted, url.ignored, url.sort, url.order, url.view]);

  useEffect(() => {
    const filtersChanged = debouncedSearch !== url.q || postedWithin !== url.posted;
    if (!filtersChanged) return;

    syncUrl({
      q: debouncedSearch,
      page: 1,
      ignored: url.ignored,
      sort: url.sort,
      order: url.order,
      posted: postedWithin,
      view: url.view
    });
  }, [
    debouncedSearch,
    url.q,
    postedWithin,
    url.posted,
    url.ignored,
    url.sort,
    url.order,
    url.view,
    syncUrl
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const postedNum = url.posted ? parseInt(url.posted, 10) : undefined;
      const data = await apiService.listCrawlCompanies({
        limit: PAGE_SIZE,
        offset,
        search: url.q.trim() || undefined,
        ignored: url.ignored,
        sort: url.sort,
        order: url.order,
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
  }, [offset, url.q, url.posted, url.ignored, url.sort, url.order]);

  useEffect(() => {
    if (!urlReady) return;
    void load();
  }, [load, urlReady]);

  const handlePageChange = (page: number) => {
    syncUrl({ ...url, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: ListViewLayout) => {
    syncUrl({ ...url, view });
  };

  const handleIgnoredFilterChange = (ignored: CompanyIgnoredFilter) => {
    syncUrl({ ...url, page: 1, ignored });
  };

  const handleSortChange = (sort: CompanyListSort) => {
    syncUrl({ ...url, page: 1, sort });
  };

  const handleOrderChange = (order: ListSortOrder) => {
    syncUrl({ ...url, page: 1, order });
  };

  const handlePostedWithinChange = (posted: string) => {
    setPostedWithin(posted);
    syncUrl({ ...url, page: 1, posted });
  };

  const hasActiveFilters = Boolean(
    url.q ||
      (url.posted && url.posted !== DEFAULT_POSTED_WITHIN) ||
      url.ignored !== 'hide' ||
      url.sort !== 'updated' ||
      url.order !== 'desc'
  );

  const clearFilters = () => {
    setSearchInput('');
    setPostedWithin(DEFAULT_POSTED_WITHIN);
    syncUrl({
      q: '',
      page: 1,
      ignored: 'hide',
      sort: 'updated',
      order: 'desc',
      posted: DEFAULT_POSTED_WITHIN,
      view: url.view
    });
  };

  const listClass = loading ? 'opacity-60 pointer-events-none' : '';

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Companies"
        actions={
          <>
            <select
              value={url.ignored}
              onChange={(e) => handleIgnoredFilterChange(e.target.value as CompanyIgnoredFilter)}
              className={headerSelectClass}
              aria-label="Employer visibility"
            >
              <option value="hide">Active employers</option>
              <option value="only">Ignored only</option>
              <option value="all">All employers</option>
            </select>
            <ListLayoutToggle value={url.view} onChange={handleViewChange} />
            <RefreshIconButton onClick={() => void load()} disabled={loading} />
          </>
        }
      />

      <div className={stickyFilterPanelClass}>
        <CompaniesFilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          postedWithin={postedWithin}
          onPostedWithinChange={handlePostedWithinChange}
          sort={url.sort}
          onSortChange={handleSortChange}
          order={url.order}
          onOrderToggle={() => handleOrderChange(url.order === 'desc' ? 'asc' : 'desc')}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title={
            url.q
              ? 'No companies match your search'
              : url.posted
                ? 'No companies with jobs in that period'
                : url.ignored === 'only'
                  ? 'No ignored companies'
                  : 'No companies in the database yet'
          }
          description={
            url.q
              ? 'Try another keyword or clear the search.'
              : url.posted
                ? 'Try a wider posting window or clear the date filter.'
                : url.ignored === 'only'
                  ? 'Mark employers as ignored from a company detail page.'
                  : 'POST crawled companies to /api/crawl/companies with your API key.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                Clear filters
              </button>
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

          {url.view === 'cards' ? (
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${listClass}`}>
              {items.map((co) => (
                <CompanyCard key={`${co.platform}:${co.companypage}`} company={co} />
              ))}
            </div>
          ) : (
            <div className={`space-y-3 ${listClass}`}>
              {items.map((co) => (
                <CompanyRow key={`${co.platform}:${co.companypage}`} company={co} />
              ))}
            </div>
          )}

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

const CompanyRow: React.FC<{ company: IndeedCompany }> = ({ company }) => {
  const to = companyDetailPath(company.platform, company.companypage);

  return (
    <Link
      to={to}
      className="group block rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-800 transition line-clamp-2">
              {company.company_name || 'Unnamed company'}
            </h3>
            {company.ignored ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Ignored
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
              {company.platform}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {company.headquarters ? <span>{company.headquarters}</span> : null}
            {company.employee_range ? <span>{company.employee_range} employees</span> : null}
            {company.founded ? <span>Founded {company.founded}</span> : null}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 text-xs text-slate-500">
          {company.rating != null ? (
            <RatingStars rating={company.rating} reviewCount={company.review_count} />
          ) : null}
          {company.jobs_count != null && company.jobs_count > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 tabular-nums">
              {company.jobs_count.toLocaleString()} jobs
            </span>
          ) : null}
          {company.updatedAt ? (
            <span>Updated {formatRelativeTime(company.updatedAt)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

const StatPill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
    {label}: {value.toLocaleString()}
  </span>
);

export default CompaniesPage;
