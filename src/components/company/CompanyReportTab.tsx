import React from 'react';
import DetailSection from '../crawl/DetailSection';
import JobMarkdown from '../crawl/JobMarkdown';
import CopyButton from '../ui/CopyButton';
import type { CompanyAiAnalyze } from '../../types/companyResearch';
import { formatDate } from '../../utils/formatters';

interface CompanyReportTabProps {
  companyName?: string;
  analyze: CompanyAiAnalyze;
  analyzing: boolean;
  onAnalyze: () => void;
  grokReady?: boolean;
  layout?: 'main' | 'default';
}

const CompanyReportTab: React.FC<CompanyReportTabProps> = ({
  companyName,
  analyze,
  analyzing,
  onAnalyze,
  grokReady = false,
  layout = 'default'
}) => {
  const isMain = layout === 'main';
  const isRunning = analyzing || analyze.status === 'running';
  const hasReport = analyze.status === 'completed' && analyze.report;
  const title = companyName?.trim() || 'Research report';

  if (isRunning) {
    return (
      <DetailSection title={title}>
        <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-slate-800">Building research report…</p>
            <p className="text-xs text-slate-500 mt-0.5">Scoring fit and drafting sections</p>
          </div>
        </div>
      </DetailSection>
    );
  }

  if (analyze.status === 'failed') {
    return (
      <DetailSection title={title}>
        <p className="text-sm text-red-800">{analyze.error ?? 'Analysis failed'}</p>
        {!isMain ? (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!grokReady}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Retry
          </button>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Use Analyze above to retry.</p>
        )}
      </DetailSection>
    );
  }

  if (!hasReport) {
    return (
      <DetailSection title={title}>
        <p className="text-sm text-slate-500">
          {!grokReady ? (
            <>
              Run <strong className="text-slate-700">Ask Grok</strong> for web research, then{' '}
              <strong className="text-slate-700">Analyze</strong> to generate your report here.
            </>
          ) : (
            <>
              Grok research is ready. Click <strong className="text-slate-700">Analyze</strong> above
              to generate your report.
            </>
          )}
        </p>
      </DetailSection>
    );
  }

  const metaParts: string[] = [];
  if (analyze.analyzedAt) metaParts.push(`Updated ${formatDate(analyze.analyzedAt)}`);
  if (analyze.relevantScore != null) {
    metaParts.push(`Fit score ${Math.round(analyze.relevantScore)}`);
  }

  return (
    <DetailSection
      title={title}
      action={
        <div className="flex items-center gap-2">
          <CopyButton text={analyze.report!} label="Copy" />
          {!isMain ? (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isRunning || !grokReady}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Re-run
            </button>
          ) : null}
        </div>
      }
    >
      {metaParts.length > 0 ? (
        <p className="mb-4 text-xs text-slate-500">{metaParts.join(' · ')}</p>
      ) : null}
      <JobMarkdown content={analyze.report!} />
    </DetailSection>
  );
};

export default CompanyReportTab;
