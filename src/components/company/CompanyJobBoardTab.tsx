import React, { useMemo } from 'react';
import DetailSection from '../crawl/DetailSection';
import HighlightedText from '../crawl/HighlightedText';
import CompanyJobCard from '../crawl/CompanyJobCard';
import TagList from '../crawl/TagList';
import type { IndeedCompany, IndeedJob } from '../../types/crawl';
import { jsonItemsToLabels } from '../../utils/crawlUtils';
import { formatDate } from '../../utils/formatters';

interface CompanyJobBoardTabProps {
  company: IndeedCompany;
  jobs: IndeedJob[];
  jobsTotal: number;
  jobsLoading: boolean;
  jobsError: string | null;
  pageSearch: string;
  ignoredSaving: boolean;
  ignoredError: string | null;
  onIgnoredChange: (ignored: boolean) => void;
  /** Hidden when ignore control lives in the page sidebar. */
  hideIgnoreBar?: boolean;
}

const CompanyJobBoardTab: React.FC<CompanyJobBoardTabProps> = ({
  company,
  jobs,
  jobsTotal,
  jobsLoading,
  jobsError,
  pageSearch,
  ignoredSaving,
  ignoredError,
  onIgnoredChange,
  hideIgnoreBar
}) => {
  const jobTitles = useMemo(
    () => jsonItemsToLabels(company.job_titles_json),
    [company.job_titles_json]
  );
  const jobLocations = useMemo(
    () => jsonItemsToLabels(company.job_locations_json),
    [company.job_locations_json]
  );
  const faqLabels = useMemo(() => {
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
  }, [company.faqs_json]);

  const filterItems = (items: string[]) => {
    const q = pageSearch.trim().toLowerCase();
    return q ? items.filter((i) => i.toLowerCase().includes(q)) : items;
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <StatCard label="Jobs in database" value={company.jobs_count} />
        <StatCard label="Salaries" value={company.salaries_tab_count} />
        <StatCard label="Q&A" value={company.qa_tab_count} />
        <StatCard label="Interviews" value={company.interviews_tab_count} />
      </div>

      <div className="space-y-5">
        <DetailSection title={jobsTotal > 0 ? `Jobs (${jobsTotal.toLocaleString()})` : 'Jobs'}>
          {jobsError ? <p className="text-sm text-red-700 mb-3">{jobsError}</p> : null}
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
                  Showing {jobs.length.toLocaleString()} of {jobsTotal.toLocaleString()} — scroll for
                  more
                </p>
              ) : null}
              <div
                className={`-mx-5 overflow-x-auto px-5 pb-2 scroll-smooth [scrollbar-width:thin] ${
                  jobsLoading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <ul className="flex w-max gap-3 snap-x snap-mandatory">
                  {jobs.map((job) => (
                    <li key={job.job_id} className="w-[17rem] shrink-0 snap-start sm:w-[19rem]">
                      <CompanyJobCard job={job} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DetailSection>

        <DetailSection title="Record details" collapsible defaultCollapsed>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Meta label="Company page slug" value={company.companypage} mono />
            <Meta label="Employer key" value={company.employer_key || '—'} mono />
            <Meta label="Headquarters" value={company.headquarters || '—'} />
            <Meta label="Size" value={company.employee_range || '—'} />
            <Meta label="Founded" value={company.founded != null ? String(company.founded) : '—'} />
            <Meta label="Gig employer" value={company.is_gig_employer === 1 ? 'Yes' : 'No'} />
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
          <DetailSection title="Raw payload" collapsible defaultCollapsed>
            <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700 ring-1 ring-slate-200/60 max-h-96">
              {JSON.stringify(company.payload_json, null, 2)}
            </pre>
          </DetailSection>
        )}
      </div>

      {!hideIgnoreBar ? (
        <section className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
          <p className="text-xs text-slate-500">Hide this employer&apos;s jobs on the Jobs page</p>
          <div className="flex items-center gap-2 shrink-0">
            {ignoredError ? (
              <span className="text-[11px] text-red-700 max-w-[12rem] truncate" title={ignoredError}>
                {ignoredError}
              </span>
            ) : null}
            <button
              type="button"
              disabled={ignoredSaving}
              onClick={() => void onIgnoredChange(!company.ignored)}
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
      ) : null}
    </>
  );
};

const Meta: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <dt className="text-xs font-medium text-slate-500">{label}</dt>
    <dd className={`mt-0.5 text-slate-900 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
  </div>
);

const StatCard: React.FC<{ label: string; value?: number | null }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center">
    <p className="text-lg font-semibold text-slate-900 tabular-nums leading-none">
      {value != null ? value.toLocaleString() : '—'}
    </p>
    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{label}</p>
  </div>
);

export default CompanyJobBoardTab;
