import React from 'react';
import RatingStars from '../crawl/RatingStars';
import RelevanceScore from './RelevanceScore';
import CompanyContactLinks from './CompanyContactLinks';
import type { ContactLink } from '../../utils/contactLinks';
import type { IndeedCompany } from '../../types/crawl';
import type { CompanyAnalyzer } from '../../types/companyResearch';
import { formatRating } from '../../utils/crawlUtils';

export type CompanyDetailView = 'report' | 'grok' | 'jobboard';

interface CompanyDetailSidebarProps {
  company: IndeedCompany;
  research: CompanyAnalyzer;
  activeView: CompanyDetailView;
  onViewChange: (view: CompanyDetailView) => void;
  grokPending: boolean;
  grokReady: boolean;
  connectedExtension: boolean;
  extensionHint?: string;
  contactLinks: ContactLink[];
  onIgnoredChange: (ignored: boolean) => void;
  ignoredSaving: boolean;
  ignoredError: string | null;
}

const viewBtn = (active: boolean) =>
  `flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
    active
      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
  }`;

const CompanyDetailSidebar: React.FC<CompanyDetailSidebarProps> = ({
  company,
  research,
  activeView,
  onViewChange,
  grokPending,
  grokReady,
  connectedExtension,
  extensionHint,
  contactLinks,
  onIgnoredChange,
  ignoredSaving,
  ignoredError
}) => {
  const name = company.company_name || 'Unnamed company';
  const hasScore =
    research.analyze.relevantScore != null && research.analyze.status === 'completed';

  return (
    <aside className="space-y-5 lg:sticky lg:top-[7.5rem]">
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
        </div>
        <div className="p-5">
          <p className="text-base font-semibold text-slate-900 line-clamp-2">{name}</p>
          <p className="mt-1 text-xs text-slate-500 capitalize">{company.platform}</p>
          {company.rating != null ? (
            <div className="mt-3">
              <RatingStars rating={company.rating} reviewCount={company.review_count} size="sm" />
              <p className="mt-1 text-xs text-slate-500">{formatRating(company.rating)} overall</p>
            </div>
          ) : null}
          {hasScore ? (
            <div className="mt-4 flex justify-center py-2 border-t border-slate-100">
              <RelevanceScore score={research.analyze.relevantScore!} size="sm" />
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
          <div className="mt-4 pt-4 border-t border-slate-100">
            <CompanyContactLinks
              contacts={contactLinks}
              grokReady={grokReady}
              variant="sidebar"
            />
          </div>
          {!grokReady && !grokPending ? (
            <p className="mt-3 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 leading-snug">
              Run <strong>Ask Grok</strong> first, then <strong>Analyze</strong> for the report.
            </p>
          ) : null}
          {!connectedExtension ? (
            <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
              Connect the extension for Grok.
              {extensionHint ? ` (${extensionHint})` : ''}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          View
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className={viewBtn(activeView === 'report')}
            onClick={() => onViewChange('report')}
          >
            Report
            {research.analyze.status === 'completed' ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
            ) : null}
          </button>
          <button
            type="button"
            className={viewBtn(activeView === 'grok')}
            onClick={() => onViewChange('grok')}
          >
            Grok
            {research.grok.status === 'completed' ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-violet-500 align-middle" />
            ) : grokPending ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse align-middle" />
            ) : null}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">Hide jobs from this employer</p>
          <button
            type="button"
            disabled={ignoredSaving}
            onClick={() => onIgnoredChange(!company.ignored)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              company.ignored
                ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {ignoredSaving ? '…' : company.ignored ? 'Unignore' : 'Ignore'}
          </button>
        </div>
        {ignoredError ? (
          <p className="mt-2 text-xs text-red-700">{ignoredError}</p>
        ) : null}
      </section>
    </aside>
  );
};

export default CompanyDetailSidebar;
