import React from 'react';
import { Link } from 'react-router-dom';
import RatingStars from '../crawl/RatingStars';
import RelevanceScore from './RelevanceScore';
import CompanyContactLinks from './CompanyContactLinks';
import type { ContactLink } from '../../utils/contactLinks';
import type { IndeedCompany } from '../../types/crawl';
import { companyDetailPath, formatRating } from '../../utils/crawlUtils';

interface CompanyOverviewCardProps {
  company: IndeedCompany;
  relevantScore?: number | null;
  contactLinks?: ContactLink[];
  grokReady?: boolean;
  grokPending?: boolean;
  connectedExtension?: boolean;
  extensionHint?: string;
  loading?: boolean;
  /** When set, company name links to the company detail page. */
  linkToDetail?: boolean;
  /** Show Grok / extension hints (company detail sidebar). */
  showResearchHints?: boolean;
}

const CompanyOverviewCard: React.FC<CompanyOverviewCardProps> = ({
  company,
  relevantScore,
  contactLinks = [],
  grokReady = false,
  grokPending = false,
  connectedExtension = true,
  extensionHint,
  loading = false,
  linkToDetail = false,
  showResearchHints = false
}) => {
  const name = company.company_name || 'Unnamed company';
  const pageSlug = company.companypage?.trim() || undefined;
  const detailHref = linkToDetail
    ? companyDetailPath(company.platform, {
        companypage: pageSlug,
        company_name: pageSlug ? undefined : company.company_name
      })
    : null;
  const hasContacts = contactLinks.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <>
            {detailHref ? (
              <Link
                to={detailHref}
                className="text-base font-semibold text-primary-700 hover:text-primary-800 line-clamp-2"
              >
                {name}
              </Link>
            ) : (
              <p className="text-base font-semibold text-slate-900 line-clamp-2">{name}</p>
            )}
            <p className="mt-1 text-xs text-slate-500 capitalize">{company.platform}</p>
            {company.ignored ? (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Ignored
              </span>
            ) : null}
            {company.rating != null ? (
              <div className="mt-3">
                <RatingStars rating={company.rating} reviewCount={company.review_count} size="sm" />
                <p className="mt-1 text-xs text-slate-500">{formatRating(company.rating)} overall</p>
              </div>
            ) : null}
            {relevantScore != null ? (
              <div className="mt-4 flex justify-center py-2 border-t border-slate-100">
                <RelevanceScore score={relevantScore} size="sm" />
              </div>
            ) : null}
            <dl className="mt-4 space-y-2 text-xs">
              {company.headquarters ? (
                <div>
                  <dt className="text-slate-400">Headquarters</dt>
                  <dd className="text-slate-700 font-medium">{company.headquarters}</dd>
                </div>
              ) : null}
              {company.employee_range ? (
                <div>
                  <dt className="text-slate-400">Size</dt>
                  <dd className="text-slate-700 font-medium">{company.employee_range}</dd>
                </div>
              ) : null}
              {company.founded != null ? (
                <div>
                  <dt className="text-slate-400">Founded</dt>
                  <dd className="text-slate-700 font-medium">{company.founded}</dd>
                </div>
              ) : null}
              {company.ceo_approval_pct != null ? (
                <div>
                  <dt className="text-slate-400">CEO approval</dt>
                  <dd className="text-slate-700 font-medium tabular-nums">{company.ceo_approval_pct}%</dd>
                </div>
              ) : null}
              {company.jobs_count != null && company.jobs_count > 0 ? (
                <div>
                  <dt className="text-slate-400">Jobs in database</dt>
                  <dd className="text-slate-700 font-medium tabular-nums">{company.jobs_count}</dd>
                </div>
              ) : null}
            </dl>
            {showResearchHints || hasContacts ? (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <CompanyContactLinks contacts={contactLinks} grokReady={grokReady} variant="sidebar" />
              </div>
            ) : null}
            {showResearchHints && !grokReady && !grokPending ? (
              <p className="mt-3 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 leading-snug">
                Run <strong>Ask Grok</strong> first, then <strong>Analyze</strong> for the report.
              </p>
            ) : null}
            {showResearchHints && !connectedExtension ? (
              <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                Connect the extension for Grok.
                {extensionHint ? ` (${extensionHint})` : ''}
              </p>
            ) : null}
            {detailHref ? (
              <Link
                to={detailHref}
                className="mt-4 block text-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Company profile
              </Link>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
};

export default CompanyOverviewCard;
