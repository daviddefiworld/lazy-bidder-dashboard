import React from 'react';
import CompanyOverviewCard from './CompanyOverviewCard';
import type { ContactLink } from '../../utils/contactLinks';
import type { IndeedCompany } from '../../types/crawl';
import type { CompanyAnalyzer } from '../../types/companyResearch';
import { companyOverviewRelevantScore } from '../../utils/companyAnalyzer';

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
  canSetIgnored: boolean;
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
  canSetIgnored,
  onIgnoredChange,
  ignoredSaving,
  ignoredError
}) => {
  const relevantScore = companyOverviewRelevantScore(research, company);

  return (
    <aside className="space-y-5 lg:sticky lg:top-[7.5rem]">
      <CompanyOverviewCard
        company={company}
        relevantScore={relevantScore}
        contactLinks={contactLinks}
        grokReady={grokReady}
        grokPending={grokPending}
        connectedExtension={connectedExtension}
        extensionHint={extensionHint}
        showResearchHints
      />

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
            disabled={ignoredSaving || !canSetIgnored}
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
        {!canSetIgnored ? (
          <p className="mt-2 text-xs text-slate-500">Only admins can change ignored status.</p>
        ) : null}
        {ignoredError ? (
          <p className="mt-2 text-xs text-red-700">{ignoredError}</p>
        ) : null}
      </section>
    </aside>
  );
};

export default CompanyDetailSidebar;
