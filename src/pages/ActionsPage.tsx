import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import apiService, { type CombineActionResult, type UncombinedCounts } from '../services/apiService';

const btnClass =
  'inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none transition';

const refreshBtnClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition';

const ActionsPage: React.FC = () => {
  const [busy, setBusy] = useState<'companies' | 'jobs' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CombineActionResult | null>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [counts, setCounts] = useState<UncombinedCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const data = await apiService.getUncombinedCounts();
      setCounts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load counts');
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const run = async (kind: 'companies' | 'jobs') => {
    const label = kind === 'companies' ? 'Combine companies' : 'Combine jobs';
    if (
      !window.confirm(
        kind === 'companies'
          ? 'Process new employers only (not yet combined)? Matches same website URL or exact company name.'
          : 'Process new jobs only (not yet combined)? Requires combined companies first.'
      )
    ) {
      return;
    }

    setBusy(kind);
    setError(null);
    setLastResult(null);
    setLastLabel(null);

    try {
      const data =
        kind === 'companies'
          ? await apiService.combineCrawlCompanies()
          : await apiService.combineCrawlJobs();
      setLastResult(data);
      setLastLabel(label);
      await loadCounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Actions" as="h2" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 min-w-[10rem]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Uncombined companies</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {countsLoading ? '…' : (counts?.companies ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 min-w-[10rem]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Uncombined jobs</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {countsLoading ? '…' : (counts?.jobs ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={refreshBtnClass}
          disabled={countsLoading || busy !== null}
          onClick={() => void loadCounts()}
        >
          Refresh counts
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {lastResult && lastLabel && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">{lastLabel} finished</p>
          <p className="mt-1 text-emerald-800">
            {lastResult.groups} group(s), {lastResult.combinedRecords} combined record(s),{' '}
            {lastResult.sourcesMarked} source row(s) marked
            {lastResult.skipped != null && lastResult.skipped > 0
              ? `, ${lastResult.skipped} skipped`
              : ''}
            .
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 max-w-xl">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Combine companies</h4>
          <p className="text-sm text-slate-500 mt-1">
            Attach new employers to an existing combined company when the website or name matches,
            or create a new combined record. Only uncombined source rows are scanned.
          </p>
          <button
            type="button"
            className={`${btnClass} mt-3`}
            disabled={busy !== null}
            onClick={() => void run('companies')}
          >
            {busy === 'companies' ? 'Combining…' : 'Combine companies'}
          </button>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Combine jobs</h4>
          <p className="text-sm text-slate-500 mt-1">
            Attach new postings to an existing combined job when employer, title, and location match,
            or create a new combined record. Only uncombined source rows are scanned.
          </p>
          <button
            type="button"
            className={`${btnClass} mt-3`}
            disabled={busy !== null}
            onClick={() => void run('jobs')}
          >
            {busy === 'jobs' ? 'Combining…' : 'Combine jobs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionsPage;
