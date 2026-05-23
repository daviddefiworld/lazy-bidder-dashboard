import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/crawl/Breadcrumbs';
import DetailSection from '../components/crawl/DetailSection';
import HighlightedText from '../components/crawl/HighlightedText';
import CompanyJobCard from '../components/crawl/CompanyJobCard';
import RatingStars from '../components/crawl/RatingStars';
import SearchField from '../components/crawl/SearchField';
import TagList from '../components/crawl/TagList';
import apiService from '../services/apiService';
import type { IndeedCompany, IndeedJob } from '../types/crawl';
import { jsonItemsToLabels } from '../utils/crawlUtils';
import { formatDate } from '../utils/formatters';

/** Max jobs loaded for horizontal scroll (API cap is 200). */
const JOBS_FETCH_LIMIT = 200;

const CompanyDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const platform = searchParams.get('platform') ?? '';
  const companypage = searchParams.get('companypage') ?? '';

  const [company, setCompany] = useState<IndeedCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [ignoredSaving, setIgnoredSaving] = useState(false);
  const [ignoredError, setIgnoredError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<IndeedJob[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!platform || !companypage) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCrawlCompany(platform, companypage);
      setCompany(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load company');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [platform, companypage]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadJobs = useCallback(async () => {
    if (!platform || !companypage) return;
    setJobsLoading(true);
    setJobsError(null);
    const countHint = company?.jobs_count;
    const limit =
      countHint != null && countHint > 0
        ? Math.min(countHint, JOBS_FETCH_LIMIT)
        : JOBS_FETCH_LIMIT;
    try {
      const data = await apiService.listCrawlJobs({
        platform,
        company_page: companypage,
        limit,
        offset: 0,
        sort: 'date'
      });
      setJobs(data.items);
      setJobsTotal(data.total);
    } catch (e) {
      setJobsError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
      setJobsTotal(0);
    } finally {
      setJobsLoading(false);
    }
  }, [platform, companypage, company?.jobs_count]);

  useEffect(() => {
    if (company) void loadJobs();
  }, [company, loadJobs]);

  const jobTitles = useMemo(
    () => (company ? jsonItemsToLabels(company.job_titles_json) : []),
    [company]
  );
  const jobLocations = useMemo(
    () => (company ? jsonItemsToLabels(company.job_locations_json) : []),
    [company]
  );
  const faqLabels = useMemo(() => {
    if (!company) return [];
    return company.faqs_json
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const q = o.question ?? o.q;
          const a = o.answer ?? o.a;
          if (q && a) return `${String(q)} — ${String(a)}`;
          if (q) return String(q);
        }
        return JSON.stringify(item);
      })
      .filter(Boolean);
  }, [company]);

  const filterItems = (items: string[]) => {
    const q = pageSearch.trim().toLowerCase();
    return q ? items.filter((i) => i.toLowerCase().includes(q)) : items;
  };

  const handleIgnoredChange = async (ignored: boolean) => {
    if (!company) return;
    setIgnoredSaving(true);
    setIgnoredError(null);
    try {
      const updated = await apiService.setCrawlCompanyIgnored(
        company.platform,
        company.companypage,
        ignored
      );
      setCompany(updated);
    } catch (e) {
      setIgnoredError(e instanceof Error ? e.message : 'Failed to update ignored status');
    } finally {
      setIgnoredSaving(false);
    }
  };

  if (!platform || !companypage) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Missing platform or companypage query parameters.</p>
        <Link to="/companies" className="mt-4 inline-block text-sm font-medium text-primary-700">
          ← Companies
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm">Loading company…</span>
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'Companies', to: '/companies' }, { label: 'Not found' }]} />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? 'Company not found'}
        </div>
        <Link to="/companies" className="inline-block mt-4 text-sm font-medium text-primary-700">
          ← Back to companies
        </Link>
      </main>
    );
  }

  const name = company.company_name || 'Unnamed company';

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 pb-24">
      <Breadcrumbs
        items={[
          { label: 'Companies', to: '/companies' },
          { label: name }
        ]}
      />

      <header className="mb-8">
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize mb-3">
          {company.platform}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{name}</h1>
          {company.ignored ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Ignored
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {company.rating != null ? (
            <RatingStars rating={company.rating} reviewCount={company.review_count} size="md" />
          ) : null}
          {company.ceo_approval_pct != null ? (
            <span className="text-sm text-slate-600">
              CEO approval <span className="font-semibold">{company.ceo_approval_pct}%</span>
            </span>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {company.website_url ? (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
            >
              Website
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : null}
          <a
            href={`https://www.indeed.com/cmp/${company.companypage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            View on Indeed
          </a>
          <button
            type="button"
            onClick={() => {
              void load();
              if (company) void loadJobs();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="sticky top-[3.5rem] z-10 py-3 mb-6 rounded-xl bg-white/95 backdrop-blur shadow-sm ring-1 ring-slate-200/60 px-4">
        <SearchField
          value={pageSearch}
          onChange={setPageSearch}
          placeholder="Search roles, locations, FAQs on this page…"
          id="company-detail-search"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Jobs in database" value={company.jobs_count} />
        <StatCard label="Salaries" value={company.salaries_tab_count} />
        <StatCard label="Q&A" value={company.qa_tab_count} />
        <StatCard label="Interviews" value={company.interviews_tab_count} />
      </div>

      <div className="space-y-5">
        <DetailSection title={jobsTotal > 0 ? `Jobs (${jobsTotal.toLocaleString()})` : 'Jobs'}>
          {jobsError ? (
            <p className="text-sm text-red-700 mb-3">{jobsError}</p>
          ) : null}
          {jobsLoading && jobs.length === 0 ? (
            <div className="-mx-5 flex gap-3 overflow-hidden px-5 pb-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[7.5rem] w-[17rem] shrink-0 animate-pulse rounded-xl bg-slate-100 sm:w-[19rem]"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">
              No jobs from this company in the crawl yet.
            </p>
          ) : (
            <>
              {jobsTotal > jobs.length ? (
                <p className="mb-3 text-xs text-slate-500">
                  Showing {jobs.length.toLocaleString()} of {jobsTotal.toLocaleString()} — scroll
                  for more
                </p>
              ) : null}
              <div
                className={`-mx-5 overflow-x-auto px-5 pb-2 scroll-smooth [scrollbar-width:thin] ${
                  jobsLoading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <ul className="flex w-max gap-3 snap-x snap-mandatory">
                  {jobs.map((job) => (
                    <li
                      key={job.job_id}
                      className="w-[17rem] shrink-0 snap-start sm:w-[19rem]"
                    >
                      <CompanyJobCard job={job} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DetailSection>

        <DetailSection title="Profile">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Meta label="Company page slug" value={company.companypage} mono />
            <Meta label="Employer key" value={company.employer_key || '—'} mono />
            <Meta label="Headquarters" value={company.headquarters || '—'} />
            <Meta label="Size" value={company.employee_range || '—'} />
            <Meta label="Founded" value={company.founded != null ? String(company.founded) : '—'} />
            <Meta
              label="Gig employer"
              value={company.is_gig_employer === 1 ? 'Yes' : 'No'}
            />
            <Meta
              label="Detail scraped"
              value={company.detail_scraped_at ? formatDate(company.detail_scraped_at) : '—'}
            />
            <Meta
              label="Last updated"
              value={company.updatedAt ? formatDate(company.updatedAt) : '—'}
            />
          </dl>
        </DetailSection>

        {filterItems(jobTitles).length > 0 && (
          <DetailSection title="Job titles on profile">
            <TagList items={filterItems(jobTitles)} emptyLabel="No titles" />
          </DetailSection>
        )}

        {filterItems(jobLocations).length > 0 && (
          <DetailSection title="Job locations">
            <TagList items={filterItems(jobLocations)} emptyLabel="No locations" />
          </DetailSection>
        )}

        {filterItems(faqLabels).length > 0 && (
          <DetailSection title="FAQs">
            <ul className="space-y-3 text-sm text-slate-700">
              {filterItems(faqLabels).map((faq, i) => (
                <li key={i} className="rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <HighlightedText text={faq} query={pageSearch} />
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        {company.similar_companies_json.length > 0 && (
          <DetailSection title="Similar companies">
            <TagList items={jsonItemsToLabels(company.similar_companies_json)} />
          </DetailSection>
        )}

        {Object.keys(company.payload_json ?? {}).length > 0 && (
          <DetailSection title="Raw payload">
            <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700 ring-1 ring-slate-200/60 max-h-96">
              {JSON.stringify(company.payload_json, null, 2)}
            </pre>
          </DetailSection>
        )}
      </div>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
        <p className="text-xs text-slate-500">
          Hide this employer&apos;s jobs on the Jobs page
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {ignoredError ? (
            <span className="text-[11px] text-red-700 max-w-[12rem] truncate" title={ignoredError}>
              {ignoredError}
            </span>
          ) : null}
          <button
            type="button"
            disabled={ignoredSaving}
            onClick={() => void handleIgnoredChange(!company.ignored)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              company.ignored
                ? 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {ignoredSaving ? 'Saving…' : company.ignored ? 'Unignore' : 'Ignore'}
          </button>
        </div>
      </section>
    </main>
  );
};

const Meta: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono
}) => (
  <div>
    <dt className="text-xs font-medium text-slate-500">{label}</dt>
    <dd className={`mt-0.5 text-slate-900 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
  </div>
);

const StatCard: React.FC<{ label: string; value?: number | null }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
    <p className="text-2xl font-semibold text-slate-900 tabular-nums">
      {value != null ? value.toLocaleString() : '—'}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
  </div>
);

export default CompanyDetailPage;
