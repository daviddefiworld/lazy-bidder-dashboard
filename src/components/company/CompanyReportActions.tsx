import React from 'react';
import type { IndeedCompany } from '../../types/crawl';

interface CompanyReportActionsProps {
  company: IndeedCompany;
  grokPending: boolean;
  analyzeBusy: boolean;
  grokReady: boolean;
  connectedExtension: boolean;
  onAskGrok: () => void;
  onAnalyze: () => void;
  onRefresh: () => void;
}

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryBtn =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed';

const CompanyReportActions: React.FC<CompanyReportActionsProps> = ({
  company,
  grokPending,
  analyzeBusy,
  grokReady,
  connectedExtension,
  onAskGrok,
  onAnalyze,
  onRefresh
}) => {
  const analyzeTitle = !grokReady
    ? 'Run Ask Grok first — Analyze needs Grok research'
    : undefined;

  return (
    <div className="flex flex-wrap gap-3">
      {company.website_url ? (
        <a
          href={company.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${primaryBtn} bg-primary-600 text-white hover:bg-primary-700`}
        >
          Website
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ) : null}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={analyzeBusy || !grokReady || grokPending}
        title={grokPending ? 'Wait for Grok research to finish' : analyzeTitle}
        className={`${primaryBtn} bg-slate-900 text-white hover:bg-slate-800`}
      >
        {analyzeBusy ? 'Analyzing…' : 'Analyze'}
      </button>
      <button
        type="button"
        onClick={onAskGrok}
        disabled={grokPending || !connectedExtension}
        title={
          !connectedExtension
            ? 'Connect extension first'
            : grokPending
              ? 'Extension is running your Grok order…'
              : undefined
        }
        className={`${primaryBtn} bg-violet-700 text-white hover:bg-violet-800`}
      >
        {grokPending ? 'Waiting for Grok…' : 'Ask Grok'}
      </button>
      <a
        href={`https://www.indeed.com/cmp/${company.companypage}`}
        target="_blank"
        rel="noopener noreferrer"
        className={secondaryBtn}
      >
        View on Indeed
      </a>
      <button type="button" onClick={onRefresh} className={secondaryBtn}>
        Refresh
      </button>
    </div>
  );
};

export default CompanyReportActions;
