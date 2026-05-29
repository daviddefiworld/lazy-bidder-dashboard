import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/crawl/Breadcrumbs';
import DetailSection from '../components/crawl/DetailSection';
import CompanyOverviewCard from '../components/company/CompanyOverviewCard';
import JobMarkdown from '../components/crawl/JobMarkdown';
import RelatedJobCard from '../components/crawl/RelatedJobCard';
import RatingStars from '../components/crawl/RatingStars';
import TagList from '../components/crawl/TagList';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import { useConnectedExtensions } from '../hooks/useConnectedExtensions';
import { useSocket } from '../contexts/SocketContext';
import { useUserActivityLogger } from '../hooks/useUserActivityLogger';
import type { IndeedCompany, IndeedJob } from '../types/crawl';
import type { CompanyAnalyzer } from '../types/companyResearch';
import {
  companyResearchOverview,
  companyOverviewRelevantScore,
  defaultCompanyAnalyzer
} from '../utils/companyAnalyzer';
import { companyDetailPath, jsonItemsToLabels } from '../utils/crawlUtils';
import { formatDate, formatExtensionId, formatJobPublished } from '../utils/formatters';

const RELATED_JOBS_LIMIT = 15;

const JobDetailPage: React.FC = () => {
  const logActivity = useUserActivityLogger();
  const loggedJobIdRef = useRef<string | null>(null);
  const { jobId: jobIdParam } = useParams<{ jobId: string }>();
  const jobId = jobIdParam ? decodeURIComponent(jobIdParam) : '';

  const [job, setJob] = useState<IndeedJob | null>(null);
  const [company, setCompany] = useState<IndeedCompany | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<IndeedJob[]>([]);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [analyzer, setAnalyzer] = useState<CompanyAnalyzer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isConnected } = useSocket();
  const { extensions } = useConnectedExtensions();
  const connectedExtension = extensions[0] ?? null;

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
    if (!job) return;
    const id = job._id ?? job.job_id ?? jobId;
    if (!id || loggedJobIdRef.current === id) return;
    loggedJobIdRef.current = id;
    logActivity({
      action: 'view_job',
      context: 'job',
      details: {
        jobId: id,
        title: job.title,
        company_name: job.company_name,
        platform: job.platform
      }
    });
  }, [job, jobId, logActivity]);

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

  const analyzerPlatform = (company?.platform || job?.platform || '').trim();
  const analyzerCompanypage = (company?.companypage || job?.company_page || '').trim();

  const loadAnalyzer = useCallback(async () => {
    if (!analyzerPlatform || !analyzerCompanypage) {
      setAnalyzer(null);
      return;
    }
    try {
      const data = await apiService.getCompanyAnalyzer(analyzerPlatform, analyzerCompanypage);
      setAnalyzer(data ?? defaultCompanyAnalyzer(analyzerPlatform, analyzerCompanypage));
    } catch {
      setAnalyzer(defaultCompanyAnalyzer(analyzerPlatform, analyzerCompanypage));
    }
  }, [analyzerPlatform, analyzerCompanypage]);

  useEffect(() => {
    void loadAnalyzer();
  }, [loadAnalyzer]);

  useEffect(() => {
    if (!isConnected || !analyzerPlatform || !analyzerCompanypage) return;

    const onAnalyzerUpdated = (data: { platform: string; companypage: string }) => {
      if (data.platform !== analyzerPlatform || data.companypage !== analyzerCompanypage) return;
      void loadAnalyzer();
    };

    socketService.on('company:analyzer_updated', onAnalyzerUpdated);
    return () => {
      socketService.off('company:analyzer_updated', onAnalyzerUpdated);
    };
  }, [isConnected, analyzerPlatform, analyzerCompanypage, loadAnalyzer]);

  useEffect(() => {
    if (analyzer?.grok.status !== 'pending' || !analyzerPlatform || !analyzerCompanypage) return;
    const interval = setInterval(() => void loadAnalyzer(), 5000);
    return () => clearInterval(interval);
  }, [analyzer?.grok.status, analyzerPlatform, analyzerCompanypage, loadAnalyzer]);

  const research = useMemo((): CompanyAnalyzer | null => {
    if (!analyzerPlatform || !analyzerCompanypage) return null;
    return analyzer ?? defaultCompanyAnalyzer(analyzerPlatform, analyzerCompanypage);
  }, [analyzer, analyzerPlatform, analyzerCompanypage]);

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

  const displayCompany = useMemo((): IndeedCompany | null => {
    if (company) return company;
    if (!job?.company_name?.trim() || !job.platform) return null;
    return {
      platform: job.platform,
      companypage: job.company_page?.trim() || '',
      company_name: job.company_name.trim(),
      rating: job.company_review_rating ?? null,
      review_count: job.company_review_count ?? null,
      employer_key: job.employer_key || '',
      headquarters: '',
      employee_range: '',
      website_url: '',
      is_gig_employer: 0,
      faqs_json: [],
      job_titles_json: [],
      job_locations_json: [],
      similar_companies_json: [],
      payload_json: {},
      detail_scraped_at: ''
    };
  }, [company, job]);

  const overviewFromResearch = useMemo(() => {
    if (!research || !displayCompany) return null;
    const { grokReady, grokPending, contactLinks } = companyResearchOverview(research);
    return {
      grokReady,
      grokPending,
      contactLinks,
      relevantScore: companyOverviewRelevantScore(research, displayCompany)
    };
  }, [research, displayCompany]);

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
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        <div className="space-y-5 min-w-0">
          <DetailSection title="Description">
            {job.description_text ? (
              <JobMarkdown content={job.description_text} />
            ) : (
              <p className="text-sm text-slate-400 italic">No description text stored.</p>
            )}
          </DetailSection>

          {hasTags && (
            <DetailSection title="Tags & attributes">
              <div className="space-y-4">
                {benefits.length > 0 && (
                  <TagGroup label="Benefits">
                    <TagList items={benefits} variant="benefit" />
                  </TagGroup>
                )}
                {occupations.length > 0 && (
                  <TagGroup label="Occupations">
                    <TagList items={occupations} />
                  </TagGroup>
                )}
                {attributes.length > 0 && (
                  <TagGroup label="Attributes">
                    <TagList items={attributes} />
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
          {displayCompany ? (
            <CompanyOverviewCard
              company={displayCompany}
              relevantScore={overviewFromResearch?.relevantScore ?? null}
              contactLinks={overviewFromResearch?.contactLinks ?? []}
              grokReady={overviewFromResearch?.grokReady ?? false}
              grokPending={overviewFromResearch?.grokPending ?? false}
              connectedExtension={!!connectedExtension}
              extensionHint={
                connectedExtension
                  ? formatExtensionId(connectedExtension.extensionId)
                  : undefined
              }
              showResearchHints={!!analyzerCompanypage}
              loading={sidebarLoading && !company}
              linkToDetail
            />
          ) : sidebarLoading ? (
            <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          ) : null}

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

export default JobDetailPage;
