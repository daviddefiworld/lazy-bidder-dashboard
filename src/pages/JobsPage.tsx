import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/crawl/EmptyState';
import JobsFilterBar, { DEFAULT_POSTED_WITHIN } from '../components/crawl/JobsFilterBar';
import ListLayoutToggle from '../components/crawl/ListLayoutToggle';
import { RefreshIconButton } from '../components/crawl/ListPageIcons';
import PaginationBar from '../components/crawl/PaginationBar';
import RatingStars from '../components/crawl/RatingStars';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import apiService from '../services/apiService';
import type { IndeedJob, JobListSort } from '../types/crawl';
import { jobDetailPath, jsonItemsToLabels } from '../utils/crawlUtils';
import { formatJobPublished } from '../utils/formatters';
import { parseListView, stickyFilterPanelClass, type ListViewLayout } from '../components/crawl/listPageStyles';
import {
  mergeJobsUrlWithPreferences,
  saveJobsListPreferences
} from '../utils/jobsListPreferences';

const PAGE_SIZE = 25;
const DEFAULT_VIEW: ListViewLayout = 'list';

type JobsUrlState = {
  q: string;
  page: number;
  sort: JobListSort;
  posted: string;
  skills: string;
  view: ListViewLayout;
};

function readJobsUrlState(params: URLSearchParams): JobsUrlState {
  const sortRaw = params.get('sort')?.toLowerCase();
  return {
    q: params.get('q') ?? '',
    page: Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1),
    sort:
      sortRaw === 'relevant' ? 'relevant' : sortRaw === 'title' ? 'title' : 'date',
    posted: params.get('posted') ?? DEFAULT_POSTED_WITHIN,
    skills: params.get('skills') ?? '',
    view: parseListView(params.get('view'), DEFAULT_VIEW)
  };
}

function writeJobsUrlState(state: JobsUrlState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.q.trim()) next.set('q', state.q.trim());
  if (state.page > 1) next.set('page', String(state.page));
  if (state.sort === 'relevant') next.set('sort', 'relevant');
  if (state.sort === 'title') next.set('sort', 'title');
  next.set('posted', state.posted);
  if (state.skills.trim()) next.set('skills', state.skills.trim());
  if (state.view !== DEFAULT_VIEW) next.set('view', state.view);
  return next;
}

function readInitialJobsFilters() {
  return mergeJobsUrlWithPreferences(new URLSearchParams(window.location.search));
}

const JobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const url = readJobsUrlState(searchParams);

  const [searchInput, setSearchInput] = useState(() => readInitialJobsFilters().q);
  const [skillsInput, setSkillsInput] = useState(() => readInitialJobsFilters().skills);
  const [sort, setSort] = useState<JobListSort>(() => readInitialJobsFilters().sort);
  const [postedWithin, setPostedWithin] = useState(() => readInitialJobsFilters().posted);
  const [urlReady, setUrlReady] = useState(false);

  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const debouncedSkills = useDebouncedValue(skillsInput, 400);

  const [items, setItems] = useState<IndeedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = (url.page - 1) * PAGE_SIZE;
  const effectiveSort: JobListSort =
    sort === 'relevant'
      ? debouncedSearch.trim()
        ? 'relevant'
        : 'date'
      : sort;

  const syncUrl = useCallback(
    (state: JobsUrlState) => {
      setSearchParams(writeJobsUrlState(state), { replace: true });
    },
    [setSearchParams]
  );

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefs = mergeJobsUrlWithPreferences(params);
    const fromUrl = readJobsUrlState(params);

    setSearchInput(prefs.q);
    setSkillsInput(prefs.skills);
    setSort(prefs.sort);
    setPostedWithin(prefs.posted);

    const target: JobsUrlState = {
      q: prefs.q,
      page: fromUrl.page,
      sort: prefs.sort,
      posted: prefs.posted,
      skills: prefs.skills,
      view: prefs.view
    };
    const next = writeJobsUrlState(target);
    if (next.toString() !== params.toString()) {
      setSearchParams(next, { replace: true });
    }
    setUrlReady(true);
  }, [setSearchParams]);

  useEffect(() => {
    saveJobsListPreferences({
      q: url.q,
      skills: url.skills,
      sort: url.sort,
      posted: url.posted,
      view: url.view
    });
  }, [url.q, url.skills, url.sort, url.posted, url.view]);

  useEffect(() => {
    const filtersChanged =
      debouncedSearch !== url.q ||
      debouncedSkills !== url.skills ||
      postedWithin !== url.posted ||
      sort !== url.sort;
    if (!filtersChanged) return;

    syncUrl({
      q: debouncedSearch,
      page: 1,
      sort,
      posted: postedWithin,
      skills: debouncedSkills,
      view: url.view
    });
  }, [debouncedSearch, debouncedSkills, sort, postedWithin, url.q, url.skills, url.posted, url.sort, url.view, syncUrl]);

  useEffect(() => {
    if (sort === 'relevant' && !url.q.trim()) {
      setSort('date');
    }
  }, [sort, url.q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const postedNum = url.posted ? parseInt(url.posted, 10) : undefined;
      const data = await apiService.listCrawlJobs({
        limit: PAGE_SIZE,
        offset,
        search: url.q.trim() || undefined,
        sort: effectiveSort,
        skills: url.skills.trim() || undefined,
        posted_within: postedNum && postedNum > 0 ? postedNum : undefined
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, url.q, url.skills, url.posted, effectiveSort]);

  useEffect(() => {
    if (!urlReady) return;
    void load();
  }, [load, urlReady]);

  const handlePageChange = (page: number) => {
    syncUrl({
      q: url.q,
      page,
      sort: url.sort,
      posted: url.posted,
      skills: url.skills,
      view: url.view
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: ListViewLayout) => {
    syncUrl({
      q: url.q,
      page: url.page,
      sort: url.sort,
      posted: url.posted,
      skills: url.skills,
      view
    });
  };

  const hasActiveFilters = Boolean(
    url.q ||
      url.skills ||
      (url.posted && url.posted !== DEFAULT_POSTED_WITHIN) ||
      url.sort === 'relevant'
  );

  const clearFilters = () => {
    setSearchInput('');
    setSkillsInput('');
    setPostedWithin('');
    setSort('date');
    syncUrl({ q: '', page: 1, sort: 'date', posted: '', skills: '', view: url.view });
  };

  const listClass = loading ? 'opacity-60 pointer-events-none' : '';

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Jobs"
        actions={
          <>
            <ListLayoutToggle value={url.view} onChange={handleViewChange} />
            <RefreshIconButton onClick={() => void load()} disabled={loading} />
          </>
        }
      />

      <div className={stickyFilterPanelClass}>
        <JobsFilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          sort={sort}
          onSortChange={setSort}
          postedWithin={postedWithin}
          onPostedWithinChange={setPostedWithin}
          skills={skillsInput}
          onSkillsChange={setSkillsInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
        {effectiveSort === 'relevant' && url.q.trim() ? (
          <p className="mt-2 text-xs text-primary-700 font-medium">Sorted by relevance to “{url.q}”</p>
        ) : null}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No jobs match your filters' : 'No jobs in the database yet'}
          description={
            hasActiveFilters
              ? 'Try different keywords, a wider date range, or fewer skill filters.'
              : 'POST crawled jobs to /api/crawl/jobs with your API key. They will appear here after sync.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                Clear all filters
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
              {items.map((job) => (
                <JobCard key={job.job_id} job={job} highlightSkills={url.skills} />
              ))}
            </div>
          ) : (
            <div className={`space-y-3 ${listClass}`}>
              {items.map((job) => (
                <JobRow key={job.job_id} job={job} highlightSkills={url.skills} />
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

const JobCard: React.FC<{ job: IndeedJob; highlightSkills?: string }> = ({ job, highlightSkills }) => {
  const location =
    job.location_short || job.location_long || [job.city, job.admin1_code].filter(Boolean).join(', ');
  const occupations = jsonItemsToLabels(job.occupations_json).slice(0, 3);
  const published = formatJobPublished(job.date_published);

  return (
    <Link
      to={jobDetailPath(job.job_id)}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-800 line-clamp-2 min-w-0">
          {job.title || job.normalized_title || 'Untitled job'}
        </h3>
        {job.expired === 1 ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Expired
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-slate-700 line-clamp-1">{job.company_name || 'Unknown company'}</p>
      {location ? <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{location}</p> : null}
      {occupations.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {occupations.map((label) => (
            <span
              key={label}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                highlightSkills && label.toLowerCase().includes(highlightSkills.trim().toLowerCase())
                  ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
        {published ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            {published.relative ?? published.label}
          </span>
        ) : (
          <span className="text-slate-400 italic">No date</span>
        )}
        {job.company_review_rating != null ? (
          <RatingStars rating={job.company_review_rating} reviewCount={job.company_review_count} />
        ) : null}
      </div>
    </Link>
  );
};

const JobRow: React.FC<{ job: IndeedJob; highlightSkills?: string }> = ({
  job,
  highlightSkills
}) => {
  const location =
    job.location_short || job.location_long || [job.city, job.admin1_code].filter(Boolean).join(', ');
  const expired = job.expired === 1;
  const occupations = jsonItemsToLabels(job.occupations_json).slice(0, 4);
  const published = formatJobPublished(job.date_published);

  return (
    <Link
      to={jobDetailPath(job.job_id)}
      className="group block rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-800 transition line-clamp-2">
              {job.title || job.normalized_title || 'Untitled job'}
            </h3>
            {expired && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Expired
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-700">{job.company_name || 'Unknown company'}</p>
          {location ? (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {location}
            </p>
          ) : null}
          {occupations.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {occupations.map((label) => (
                <span
                  key={label}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    highlightSkills &&
                    label.toLowerCase().includes(highlightSkills.trim().toLowerCase())
                      ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {job.description_text ? (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description_text}</p>
          ) : null}
        </div>
        <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 text-xs text-slate-500">
          {published ? (
            <span
              className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700"
              title={published.relative ?? published.label}
            >
              {published.relative ?? published.label}
            </span>
          ) : (
            <span className="text-slate-400 italic">No publish date</span>
          )}
          {job.company_review_rating != null ? (
            <RatingStars rating={job.company_review_rating} reviewCount={job.company_review_count} />
          ) : null}
          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[10rem]" title={job.job_id}>
            {job.job_id}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default JobsPage;
