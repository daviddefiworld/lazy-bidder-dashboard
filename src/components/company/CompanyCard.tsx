import React from 'react';
import { Link } from 'react-router-dom';
import RatingStars from '../crawl/RatingStars';
import RelevanceScore from './RelevanceScore';
import type { IndeedCompany } from '../../types/crawl';
import { companyDetailPath } from '../../utils/crawlUtils';
import { formatRelativeTime } from '../../utils/formatters';

const StatPill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
    {label}: {value.toLocaleString()}
  </span>
);

const CompanyCard: React.FC<{ company: IndeedCompany; className?: string }> = ({
  company,
  className = ''
}) => {
  const pageSlug = company.companypage?.trim() || undefined;
  const to =
    companyDetailPath(company.platform, {
      companypage: pageSlug,
      company_name: pageSlug ? undefined : company.company_name
    }) ?? '/companies';

  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 h-full ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-800 line-clamp-2">
              {company.company_name || 'Unnamed company'}
            </h3>
            {company.ignored ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Ignored
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 capitalize mt-0.5">{company.platform}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {company.fit_score != null ? <RelevanceScore score={company.fit_score} size="sm" /> : null}
          {company.rating != null ? (
            <RatingStars rating={company.rating} reviewCount={company.review_count} />
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-2 text-sm text-slate-600">
        {company.headquarters ? (
          <p className="line-clamp-1" title={company.headquarters}>
            HQ: {company.headquarters}
          </p>
        ) : null}
        {company.employee_range ? <p>{company.employee_range} employees</p> : null}
        {company.founded ? <p>Founded {company.founded}</p> : null}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
        {company.jobs_count != null && company.jobs_count > 0 ? (
          <StatPill label="Jobs" value={company.jobs_count} />
        ) : null}
        {company.salaries_tab_count != null && company.salaries_tab_count > 0 ? (
          <StatPill label="Salaries" value={company.salaries_tab_count} />
        ) : null}
        {company.qa_tab_count != null && company.qa_tab_count > 0 ? (
          <StatPill label="Q&A" value={company.qa_tab_count} />
        ) : null}
      </div>

      {company.updatedAt ? (
        <p className="mt-3 text-[11px] text-slate-400">
          Updated {formatRelativeTime(company.updatedAt)}
        </p>
      ) : null}
    </Link>
  );
};

export default CompanyCard;
