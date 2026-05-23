import React from 'react';
import { Link } from 'react-router-dom';
import type { IndeedJob } from '../../types/crawl';
import { jobDetailPath } from '../../utils/crawlUtils';
import { formatJobPublished } from '../../utils/formatters';

interface RelatedJobCardProps {
  job: IndeedJob;
}

const RelatedJobCard: React.FC<RelatedJobCardProps> = ({ job }) => {
  const title = job.title || job.normalized_title || 'Untitled job';
  const location =
    job.location_short || job.location_long || [job.city, job.admin1_name].filter(Boolean).join(', ');
  const published = formatJobPublished(job.date_published);

  return (
    <Link
      to={jobDetailPath(job.job_id)}
      className="block rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 transition hover:border-primary-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <p className="text-sm font-medium text-slate-900 line-clamp-2">{title}</p>
      {location ? <p className="mt-0.5 text-xs text-slate-500 truncate">{location}</p> : null}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        {published ? (
          <span title={published.label}>{published.relative ?? published.label}</span>
        ) : (
          <span className="italic">No date</span>
        )}
        {job.expired === 1 ? (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
            Expired
          </span>
        ) : null}
      </div>
    </Link>
  );
};

export default RelatedJobCard;
