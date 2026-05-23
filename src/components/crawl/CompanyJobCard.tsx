import React from 'react';
import { Link } from 'react-router-dom';
import type { IndeedJob } from '../../types/crawl';
import { jobDetailPath } from '../../utils/crawlUtils';
import { formatJobPublished } from '../../utils/formatters';

interface CompanyJobCardProps {
  job: IndeedJob;
}

const CompanyJobCard: React.FC<CompanyJobCardProps> = ({ job }) => {
  const title = job.title || job.normalized_title || 'Untitled job';
  const location =
    job.location_short || job.location_long || [job.city, job.admin1_name].filter(Boolean).join(', ');
  const published = formatJobPublished(job.date_published);

  return (
    <Link
      to={jobDetailPath(job.job_id)}
      className="group flex h-full min-h-[7.5rem] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <p className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-800">
        {title}
      </p>
      {location ? (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2" title={location}>
          {location}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-400 italic">No location</p>
      )}
      <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        {published ? (
          <span className="truncate" title={published.label}>
            {published.relative ?? published.label}
          </span>
        ) : (
          <span className="italic">No date</span>
        )}
        {job.expired === 1 ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
            Expired
          </span>
        ) : null}
      </div>
    </Link>
  );
};

export default CompanyJobCard;
