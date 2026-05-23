import React from 'react';
import DetailSection from '../crawl/DetailSection';
import CompanyJobCard from '../crawl/CompanyJobCard';
import type { IndeedJob } from '../../types/crawl';

const PREVIEW_LIMIT = 12;

interface CompanyJobsStripProps {
  jobs: IndeedJob[];
  jobsTotal: number;
  jobsLoading: boolean;
  jobsError: string | null;
  onViewAll: () => void;
}

const CompanyJobsStrip: React.FC<CompanyJobsStripProps> = ({
  jobs,
  jobsTotal,
  jobsLoading,
  jobsError,
  onViewAll
}) => {
  const preview = jobs.slice(0, PREVIEW_LIMIT);
  const title =
    jobsTotal > 0 ? `Jobs (${jobsTotal.toLocaleString()})` : 'Jobs';

  return (
    <DetailSection
      title={title}
      action={
        jobsTotal > preview.length ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-primary-700 hover:text-primary-800"
          >
            View all →
          </button>
        ) : undefined
      }
    >
      {jobsError ? <p className="text-sm text-red-700 mb-3">{jobsError}</p> : null}
      {jobsLoading && preview.length === 0 ? (
        <div className="-mx-5 flex gap-3 overflow-hidden px-5 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[7.5rem] w-[17rem] shrink-0 animate-pulse rounded-xl bg-slate-100 sm:w-[19rem]"
            />
          ))}
        </div>
      ) : preview.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-2">No jobs from this company yet.</p>
      ) : (
        <>
          {jobsTotal > preview.length ? (
            <p className="mb-3 text-xs text-slate-500">
              Showing {preview.length.toLocaleString()} of {jobsTotal.toLocaleString()} — scroll for
              more
            </p>
          ) : null}
          <div
            className={`-mx-5 overflow-x-auto px-5 pb-2 scroll-smooth [scrollbar-width:thin] ${
              jobsLoading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <ul className="flex w-max gap-3 snap-x snap-mandatory">
              {preview.map((job) => (
                <li key={job.job_id} className="w-[17rem] shrink-0 snap-start sm:w-[19rem]">
                  <CompanyJobCard job={job} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </DetailSection>
  );
};

export default CompanyJobsStrip;
