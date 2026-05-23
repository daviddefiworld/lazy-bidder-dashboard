import React from 'react';
import DetailSection from '../crawl/DetailSection';
import JobMarkdown from '../crawl/JobMarkdown';
import type { CompanyGrokResearch } from '../../types/companyResearch';
import { formatDate } from '../../utils/formatters';

interface CompanyGrokTabProps {
  grok: CompanyGrokResearch;
  grokBusy: boolean;
  grokOrderStatus?: 'pending' | 'executing' | null;
  onAskGrok: () => void;
  extensionHint?: string;
}

const CompanyGrokTab: React.FC<CompanyGrokTabProps> = ({
  grok,
  grokBusy,
  grokOrderStatus,
  onAskGrok,
  extensionHint
}) => {
  const isPending = grokBusy || grok.status === 'pending';

  if (isPending) {
    const phaseLabel =
      grokOrderStatus === 'executing'
        ? 'Extension is querying Grok…'
        : grokOrderStatus === 'pending'
          ? 'Order queued, waiting for extension…'
          : 'Grok order in progress…';

    return (
      <DetailSection title="Grok research">
        <div className="py-6 text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-800">{phaseLabel}</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The order was sent to your browser extension. This page refreshes automatically when
            Grok finishes (usually 30–90 seconds).
          </p>
          {grok.orderId ? (
            <p className="mt-2 text-[11px] text-violet-600 font-mono truncate max-w-full">
              Order {grok.orderId.slice(0, 8)}…
            </p>
          ) : null}
          {extensionHint ? (
            <p className="mt-1 text-[11px] text-violet-600">{extensionHint}</p>
          ) : null}
        </div>
      </DetailSection>
    );
  }

  if (grok.status === 'failed' && !isPending) {
    return (
      <DetailSection
        title="Grok research"
        action={
          <button
            type="button"
            onClick={onAskGrok}
            className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-50"
          >
            Try again
          </button>
        }
      >
        <p className="text-sm text-red-800">{grok.error ?? 'Grok research failed'}</p>
        <p className="mt-2 text-xs text-slate-500">Use Ask Grok above to run a new order.</p>
      </DetailSection>
    );
  }

  if (grok.status === 'completed' && grok.text) {
    return (
      <DetailSection
        title="Grok research"
        action={
          <button
            type="button"
            onClick={onAskGrok}
            disabled={grokBusy}
            className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-50"
          >
            Refresh
          </button>
        }
      >
        {grok.researchedAt ? (
          <p className="mb-4 text-xs text-slate-500">Updated {formatDate(grok.researchedAt)}</p>
        ) : null}
        <JobMarkdown content={grok.text} />
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Grok research">
      <p className="text-sm text-slate-500">
        Business overview, news, and <strong className="text-slate-700">contact info for key people</strong>.
        Use Ask Grok above to start.
      </p>
    </DetailSection>
  );
};

export default CompanyGrokTab;
