import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import CompaniesFilterBar from '../components/crawl/CompaniesFilterBar';
import EmptyState from '../components/crawl/EmptyState';
import { DEFAULT_POSTED_WITHIN } from '../components/crawl/JobsFilterBar';
import { RefreshIconButton } from '../components/crawl/ListPageIcons';
import PaginationBar from '../components/crawl/PaginationBar';
import CompanyCard from '../components/company/CompanyCard';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserActivityLogger } from '../hooks/useUserActivityLogger';
import apiService from '../services/apiService';
import type { IndeedCompany } from '../types/crawl';
import { headerSelectClass, stickyFilterPanelClass } from '../components/crawl/listPageStyles';
import {
  companiesFiltersDifferFromDefaults,
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
  const logActivity = useUserActivityLogger();
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
  const prevLoggedSearchRef = useRef<string | null>(null);

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
    if (!urlReady) return;
    saveCompaniesListPreferences({
      q: searchInput,
      posted: postedWithin,
      ignored: url.ignored,
      sort: url.sort,
      order: url.order,
      view: url.view
    });
  }, [urlReady, searchInput, postedWithin, url.ignored, url.sort, url.order, url.view]);

  useEffect(() => {
    if (debouncedSearch !== searchInput) return;

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
    searchInput,
    url.q,
    postedWithin,
    url.posted,
    url.ignored,
    url.sort,
    url.order,
    url.view,
    syncUrl
  ]);

  useEffect(() => {
    if (!urlReady) return;
    if (debouncedSearch !== searchInput) return;

    if (prevLoggedSearchRef.current === null) {
      prevLoggedSearchRef.current = `${debouncedSearch}\0${postedWithin}`;
      return;
    }

    const signature = `${debouncedSearch}\0${postedWithin}`;
    if (prevLoggedSearchRef.current === signature) return;
    prevLoggedSearchRef.current = signature;

    logActivity({
      action: 'search',
      context: 'companies',
      details: {
        query: debouncedSearch,
        posted: postedWithin,
        ignored: url.ignored
      }
    });
  }, [urlReady, debouncedSearch, searchInput, postedWithin, url.ignored, logActivity]);

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

  const handleIgnoredFilterChange = (ignored: CompanyIgnoredFilter) => {
    syncUrl({ ...url, page: 1, ignored });
  };

  const handleSortChange = (sort: CompanyListSort) => {
    logActivity({
      action: 'sort',
      context: 'companies',
      details: {
        sort,
        order: url.order,
        query: url.q,
        posted: url.posted,
        ignored: url.ignored
      }
    });
    syncUrl({ ...url, page: 1, sort });
  };

  const handleOrderChange = (order: ListSortOrder) => {
    logActivity({
      action: 'sort',
      context: 'companies',
      details: {
        sort: url.sort,
        order,
        query: url.q,
        posted: url.posted,
        ignored: url.ignored
      }
    });
    syncUrl({ ...url, page: 1, order });
  };

  const handlePostedWithinChange = (posted: string) => {
    setPostedWithin(posted);
    syncUrl({ ...url, page: 1, posted });
  };

  const hasActiveFilters = companiesFiltersDifferFromDefaults({
    q: searchInput,
    posted: postedWithin,
    ignored: url.ignored,
    sort: url.sort,
    order: url.order
  });

  const clearFilters = () => {
    setSearchInput('');
    setPostedWithin(DEFAULT_POSTED_WITHIN);
    syncUrl({
      q: '',
      page: 1,
      ignored: 'hide',
      sort: 'fit_score',
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

          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${listClass}`}>
            {items.map((co) => (
              <CompanyCard
                key={`${co.platform}:${co.companypage || co.company_name}`}
                company={co}
              />
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

export default CompaniesPage;
