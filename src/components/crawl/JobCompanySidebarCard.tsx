import React from 'react';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import type { IndeedCompany } from '../../types/crawl';
import { companyDetailPath, formatRating } from '../../utils/crawlUtils';

interface JobCompanySidebarCardProps {
  companyName: string;
  platform: string;
  companyPage?: string;
  /** From job when company record is missing */
  jobRating?: number | null;
  jobReviewCount?: number | null;
  company?: IndeedCompany | null;
  loading?: boolean;
}

const JobCompanySidebarCard: React.FC<JobCompanySidebarCardProps> = ({
  companyName,
  platform,
  companyPage,
  jobRating,
  jobReviewCount,
  company,
  loading
}) => {
  const name = company?.company_name || companyName || 'Unknown company';
  const rating = company?.rating ?? jobRating;
  const reviewCount = company?.review_count ?? jobReviewCount;
  const detailLink =
    companyPage && platform ? companyDetailPath(platform, companyPage) : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Company</h2>
      </div>
      <div className="p-5">
      {loading ? (
        <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <>
          {detailLink ? (
            <Link
              to={detailLink}
              className="text-base font-semibold text-primary-700 hover:text-primary-800 hover:underline line-clamp-2"
            >
              {name}
            </Link>
          ) : (
            <p className="text-base font-semibold text-slate-900 line-clamp-2">{name}</p>
          )}
          <p className="mt-1 text-xs text-slate-500 capitalize">{platform}</p>
          {rating != null ? (
            <div className="mt-3">
              <RatingStars rating={rating} reviewCount={reviewCount} size="sm" />
              <p className="mt-1 text-xs text-slate-500">{formatRating(rating)} overall</p>
            </div>
          ) : null}
          <dl className="mt-4 space-y-2 text-xs">
            {company?.headquarters ? (
              <div>
                <dt className="text-slate-400">Headquarters</dt>
                <dd className="text-slate-700 font-medium">{company.headquarters}</dd>
              </div>
            ) : null}
            {company?.employee_range ? (
              <div>
                <dt className="text-slate-400">Size</dt>
                <dd className="text-slate-700 font-medium">{company.employee_range}</dd>
              </div>
            ) : null}
            {company?.founded ? (
              <div>
                <dt className="text-slate-400">Founded</dt>
                <dd className="text-slate-700 font-medium">{company.founded}</dd>
              </div>
            ) : null}
            {company?.jobs_count != null && company.jobs_count > 0 ? (
              <div>
                <dt className="text-slate-400">Jobs in database</dt>
                <dd className="text-slate-700 font-medium tabular-nums">{company.jobs_count}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            {detailLink ? (
              <Link
                to={detailLink}
                className="text-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Company profile
              </Link>
            ) : null}
            {companyPage ? (
              <a
                href={`https://www.indeed.com${companyPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                View on Indeed
              </a>
            ) : null}
          </div>
        </>
      )}
      </div>
    </section>
  );
};

export default JobCompanySidebarCard;
