import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/crawl/Breadcrumbs';
import DetailSection from '../components/crawl/DetailSection';
import JobCompanySidebarCard from '../components/crawl/JobCompanySidebarCard';
import JobMarkdown from '../components/crawl/JobMarkdown';
import RelatedJobCard from '../components/crawl/RelatedJobCard';
import RatingStars from '../components/crawl/RatingStars';
import SearchField from '../components/crawl/SearchField';
import TagList from '../components/crawl/TagList';
import apiService from '../services/apiService';
import type { IndeedCompany, IndeedJob } from '../types/crawl';
import { companyDetailPath, countSearchMatches, jsonItemsToLabels } from '../utils/crawlUtils';
import { formatDate, formatJobPublished } from '../utils/formatters';

const RELATED_JOBS_LIMIT = 15;

const JobDetailPage: React.FC = () => {
  const { jobId: jobIdParam } = useParams<{ jobId: string }>();
  const jobId = jobIdParam ? decodeURIComponent(jobIdParam) : '';

  const [job, setJob] = useState<IndeedJob | null>(null);
  const [company, setCompany] = useState<IndeedCompany | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<IndeedJob[]>([]);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCrawlJob(jobId);
      setJob(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load job');
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!job?.company_name?.trim()) {
      setCompany(null);
      setRelatedJobs([]);
      setRelatedTotal(0);
      return;
    }

    let cancelled = false;
    setSidebarLoading(true);

    const loadSidebar = async () => {
      const companyPromise = (async () => {
        if (!job.platform) return null;

        if (job.company_page?.trim()) {
          const byPage = await apiService
            .getCrawlCompany(job.platform, { companypage: job.company_page.trim() })
            .catch(() => null);
          if (byPage) return byPage;
        }

        return apiService
          .getCrawlCompany(job.platform, { company_name: job.company_name.trim() })
          .catch(() => null);
      })();

      const jobsPromise = apiService.listCrawlJobs({
        company_name: job.company_name,
        platform: job.platform || undefined,
        limit: RELATED_JOBS_LIMIT + 1,
        offset: 0,
        sort: 'date'
      });

      try {
        const [companyData, jobsResult] = await Promise.all([companyPromise, jobsPromise]);
        if (cancelled) return;
        setCompany(companyData);
        const others = jobsResult.items.filter((j) => j.job_id !== job.job_id);
        setRelatedJobs(others.slice(0, RELATED_JOBS_LIMIT));
        setRelatedTotal(Math.max(0, jobsResult.total - (jobsResult.items.some((j) => j.job_id === job.job_id) ? 1 : 0)));
      } catch {
        if (!cancelled) {
          setCompany(null);
          setRelatedJobs([]);
          setRelatedTotal(0);
        }
      } finally {
        if (!cancelled) setSidebarLoading(false);
      }
    };

    void loadSidebar();
    return () => {
      cancelled = true;
    };
  }, [job?.job_id, job?.company_name, job?.company_page, job?.platform]);

  const benefits = useMemo(
    () => (job ? jsonItemsToLabels(job.benefits_json) : []),
    [job]
  );
  const occupations = useMemo(
    () => (job ? jsonItemsToLabels(job.occupations_json) : []),
    [job]
  );
  const attributes = useMemo(
    () => (job ? jsonItemsToLabels(job.attributes_json) : []),
    [job]
  );
  const hasTags = benefits.length > 0 || occupations.length > 0 || attributes.length > 0;
  const hasPayload = Object.keys(job?.payload_json ?? {}).length > 0;

  const descriptionMatches = useMemo(() => {
    if (!job?.description_text || !pageSearch.trim()) return 0;
    return countSearchMatches(job.description_text, pageSearch);
  }, [job?.description_text, pageSearch]);

  const copyDescription = useCallback(async () => {
    if (!job?.description_text) return;
    try {
      await navigator.clipboard.writeText(job.description_text);
      setCopyStatus('ok');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('fail');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [job?.description_text]);

  if (!jobId) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        Missing job ID in URL.
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm">Loading job…</span>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'Jobs', to: '/jobs' }, { label: 'Not found' }]} />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? 'Job not found'}
        </div>
        <Link to="/jobs" className="inline-block mt-4 text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Back to jobs
        </Link>
      </main>
    );
  }

  const title = job.title || job.normalized_title || 'Untitled job';
  const location =
    job.location_long || job.location_short || [job.city, job.admin1_name].filter(Boolean).join(', ');
  const published = formatJobPublished(job.date_published);
  const companyName = job.company_name || 'Unknown company';
  const companyPageSlug = (company?.companypage || job.company_page)?.trim() || undefined;
  const companyLink = job.platform
    ? companyDetailPath(job.platform, {
        companypage: companyPageSlug,
        company_name: companyPageSlug ? undefined : companyName
      })
    : null;
  const applyPlatformLabel = job.platform?.trim()
    ? `Apply on ${job.platform.charAt(0).toUpperCase()}${job.platform.slice(1)}`
    : 'Apply now';

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 pb-24">
      <Breadcrumbs
        items={[
          { label: 'Jobs', to: '/jobs' },
          { label: companyName, to: companyLink ?? undefined },
          { label: title }
        ]}
      />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {job.platform ? (
            <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
              {job.platform}
            </span>
          ) : null}
          {job.expired === 1 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expired
            </span>
          ) : null}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          {companyLink ? (
            <Link to={companyLink} className="font-medium text-primary-700 hover:text-primary-800">
              {companyName}
            </Link>
          ) : (
            <span className="font-medium text-slate-800">{companyName}</span>
          )}
          {location ? (
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </span>
          ) : null}
          {published ? (
            <span
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
              title={published.label}
            >
              Posted {published.relative ?? published.label}
            </span>
          ) : null}
          {job.company_review_rating != null ? (
            <RatingStars
              rating={job.company_review_rating}
              reviewCount={job.company_review_count}
              size="md"
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {job.apply_url ? (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
            >
              {applyPlatformLabel}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : null}
          {job.description_text ? (
            <button
              type="button"
              onClick={() => void copyDescription()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {copyStatus === 'ok' ? 'Copied' : copyStatus === 'fail' ? 'Copy failed' : 'Copy description'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void loadJob()}
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
          placeholder="Search in description and tags…"
          id="job-detail-search"
        />
        {pageSearch.trim() ? (
          <p className="mt-2 text-xs text-slate-500">
            {descriptionMatches > 0 ? (
              <>
                <span className="font-medium text-slate-700">{descriptionMatches}</span> match
                {descriptionMatches === 1 ? '' : 'es'} in description
              </>
            ) : (
              'No matches in description'
            )}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        <div className="space-y-5 min-w-0">
          <DetailSection title="Description">
            {job.description_text ? (
              <JobMarkdown content={job.description_text} searchQuery={pageSearch} />
            ) : (
              <p className="text-sm text-slate-400 italic">No description text stored.</p>
            )}
          </DetailSection>

          {hasTags && (
            <DetailSection title="Tags & attributes">
              <div className="space-y-4">
                {benefits.length > 0 && (
                  <TagGroup label="Benefits">
                    <FilteredTagList items={benefits} query={pageSearch} variant="benefit" />
                  </TagGroup>
                )}
                {occupations.length > 0 && (
                  <TagGroup label="Occupations">
                    <FilteredTagList items={occupations} query={pageSearch} />
                  </TagGroup>
                )}
                {attributes.length > 0 && (
                  <TagGroup label="Attributes">
                    <FilteredTagList items={attributes} query={pageSearch} />
                  </TagGroup>
                )}
              </div>
            </DetailSection>
          )}

          <DetailSection title="Record details" collapsible defaultCollapsed>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Meta label="Job ID" value={job.job_id} mono />
              <Meta label="Indeed key" value={job.indeed_job_key} mono />
              <Meta label="Platform" value={job.platform || '—'} />
              <Meta label="Employer key" value={job.employer_key || '—'} mono />
              <Meta
                label="Date published"
                value={
                  published
                    ? `${published.label}${published.relative ? ` (${published.relative})` : ''}`
                    : '—'
                }
              />
              <Meta label="Source query" value={job.source_query || '—'} />
              <Meta label="Source location" value={job.source_location || '—'} />
              <Meta label="Source sort" value={job.source_sort || '—'} />
              <Meta label="Crawl scraped at" value={job.job_scraped_at ? formatDate(job.job_scraped_at) : '—'} />
            </dl>
          </DetailSection>

          {hasPayload && (
            <DetailSection title="Raw payload" collapsible defaultCollapsed>
              <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700 ring-1 ring-slate-200/60 max-h-96">
                {JSON.stringify(job.payload_json, null, 2)}
              </pre>
            </DetailSection>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[7.5rem]">
          <JobCompanySidebarCard
            companyName={companyName}
            platform={job.platform}
            companyPage={companyPageSlug}
            jobRating={job.company_review_rating}
            jobReviewCount={job.company_review_count}
            company={company}
            loading={sidebarLoading && !company}
          />

          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">More from this company</h2>
                {relatedTotal > 0 ? (
                  <span className="text-xs text-slate-400 tabular-nums">{relatedTotal}</span>
                ) : null}
              </div>
            </div>
            <div className="p-4">
              {sidebarLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : relatedJobs.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">
                  No other jobs from this company in the crawl yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {relatedJobs.map((related) => (
                    <li key={related.job_id}>
                      <RelatedJobCard job={related} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>
      </div>
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

const TagGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
    {children}
  </div>
);

const FilteredTagList: React.FC<{
  items: string[];
  query: string;
  variant?: 'default' | 'benefit';
}> = ({ items, query, variant }) => {
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => i.toLowerCase().includes(q)) : items;
  if (q && filtered.length === 0) {
    return <p className="text-sm text-slate-400 italic">No matching tags</p>;
  }
  return <TagList items={filtered} variant={variant} />;
};

export default JobDetailPage;
