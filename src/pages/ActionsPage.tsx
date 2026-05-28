import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import apiService, {
  type CombineActionResult,
  type CompanyAnalyzerBatchOverview,
  type CompanyBatchAnalyzeStatus,
  type UncombinedCounts
} from '../services/apiService';
import socketService from '../services/socketService';

const btnClass =
  'inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none transition';

const refreshBtnClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition';

const stopBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition';

const secondaryBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition';

function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

const AVG_SAMPLE_SIZE = 20;

const ActionsPage: React.FC = () => {
  const [busy, setBusy] = useState<'companies' | 'jobs' | 'recombine-companies' | 'recombine-jobs' | null>(null);
  const [analyzerStarting, setAnalyzerStarting] = useState(false);
  const [reanalyzerStarting, setReanalyzerStarting] = useState(false);
  const [analyzerStopping, setAnalyzerStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CombineActionResult | null>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [counts, setCounts] = useState<UncombinedCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [analyzerOverview, setAnalyzerOverview] = useState<CompanyAnalyzerBatchOverview | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(true);
  const [analyzerWindowAvgMs, setAnalyzerWindowAvgMs] = useState<number | undefined>();
  const analyzerAvgCheckpointRef = useRef<{
    batchKey: string;
    checkpointMs: number;
    checkpointCompleted: number;
  } | null>(null);

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

  const loadAnalyzerOverview = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setAnalyzerLoading(true);
    try {
      const data = await apiService.getCompanyAnalyzerBatchOverview();
      setAnalyzerOverview(data);
    } catch (e) {
      if (!opts?.silent) setError(e instanceof Error ? e.message : 'Failed to load analyzer status');
    } finally {
      if (!opts?.silent) setAnalyzerLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
    void loadAnalyzerOverview();
  }, [loadCounts, loadAnalyzerOverview]);

  useEffect(() => {
    const onBatchUpdated = (data: { batch: CompanyBatchAnalyzeStatus }) => {
      setAnalyzerOverview((prev) => ({
        nonAnalyzed: prev?.nonAnalyzed ?? data.batch.remaining,
        reanalyzeEligible: prev?.reanalyzeEligible ?? 0,
        batch: data.batch
      }));
      if (!data.batch.running) {
        void loadAnalyzerOverview({ silent: true });
      }
    };

    socketService.on('company:batch_analyzer_updated', onBatchUpdated);
    return () => {
      socketService.off('company:batch_analyzer_updated', onBatchUpdated);
    };
  }, [loadAnalyzerOverview]);

  useEffect(() => {
    const interval = window.setInterval(
      () => void loadAnalyzerOverview({ silent: true }),
      analyzerOverview?.batch.running ? 3000 : 15000
    );
    return () => window.clearInterval(interval);
  }, [analyzerOverview?.batch.running, loadAnalyzerOverview]);

  useEffect(() => {
    const batch = analyzerOverview?.batch;
    if (!batch?.startedAt) {
      setAnalyzerWindowAvgMs(undefined);
      analyzerAvgCheckpointRef.current = null;
      return;
    }

    const batchKey = batch.startedAt;
    const startMs = new Date(batch.startedAt).getTime();
    if (!Number.isFinite(startMs)) return;

    const endMs = batch.running
      ? Date.now()
      : batch.finishedAt
        ? new Date(batch.finishedAt).getTime()
        : Date.now();
    if (!Number.isFinite(endMs)) return;

    const ref = analyzerAvgCheckpointRef.current;
    if (!ref || ref.batchKey !== batchKey) {
      analyzerAvgCheckpointRef.current = {
        batchKey,
        checkpointMs: startMs,
        checkpointCompleted: 0
      };
      setAnalyzerWindowAvgMs(undefined);
    }

    const checkpoint = analyzerAvgCheckpointRef.current!;
    const windowsDone = Math.floor(batch.completed / AVG_SAMPLE_SIZE);
    const windowsRecorded = Math.floor(checkpoint.checkpointCompleted / AVG_SAMPLE_SIZE);
    if (windowsDone > windowsRecorded) {
      const companiesInWindow = AVG_SAMPLE_SIZE * (windowsDone - windowsRecorded);
      const elapsed = endMs - checkpoint.checkpointMs;
      if (elapsed > 0) {
        setAnalyzerWindowAvgMs(Math.round(elapsed / companiesInWindow));
      }
      checkpoint.checkpointMs = endMs;
      checkpoint.checkpointCompleted = windowsDone * AVG_SAMPLE_SIZE;
    }
  }, [
    analyzerOverview?.batch?.startedAt,
    analyzerOverview?.batch?.completed,
    analyzerOverview?.batch?.running,
    analyzerOverview?.batch?.finishedAt
  ]);

  const run = async (kind: 'companies' | 'jobs' | 'recombine-companies' | 'recombine-jobs') => {
    const labelByKind: Record<typeof kind, string> = {
      companies: 'Combine companies',
      jobs: 'Combine jobs',
      'recombine-companies': 'Recombine companies',
      'recombine-jobs': 'Recombine jobs'
    };
    const label = labelByKind[kind];
    setBusy(kind);
    setError(null);
    setLastResult(null);
    setLastLabel(null);

    try {
      const data =
        kind === 'companies'
          ? await apiService.combineCrawlCompanies()
          : kind === 'jobs'
            ? await apiService.combineCrawlJobs()
            : kind === 'recombine-companies'
              ? await apiService.recombineCrawlCompanies()
              : await apiService.recombineCrawlJobs();
      setLastResult(data);
      setLastLabel(label);
      await loadCounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const runAnalyzer = async () => {
    setAnalyzerStarting(true);
    setError(null);
    try {
      const data = await apiService.startCompanyAnalyzerBatch();
      setAnalyzerOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start analyzer batch');
    } finally {
      setAnalyzerStarting(false);
    }
  };

  const runReanalyzer = async () => {
    setReanalyzerStarting(true);
    setError(null);
    try {
      const data = await apiService.startCompanyReanalyzerBatch();
      setAnalyzerOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start reanalyze batch');
    } finally {
      setReanalyzerStarting(false);
    }
  };

  const stopAnalyzer = async () => {
    setAnalyzerStopping(true);
    setError(null);
    try {
      const data = await apiService.stopCompanyAnalyzerBatch();
      setAnalyzerOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop analyzer batch');
    } finally {
      setAnalyzerStopping(false);
    }
  };

  const analyzerBatch = analyzerOverview?.batch;
  const analyzerRunning = Boolean(analyzerBatch?.running);
  const analyzerDone = (analyzerBatch?.completed ?? 0) + (analyzerBatch?.failed ?? 0);
  const analyzerTotal = analyzerBatch?.total ?? 0;
  const analyzerProgress = analyzerTotal > 0 ? Math.round((analyzerDone / analyzerTotal) * 100) : 0;
  const analyzerEtaMs =
    analyzerRunning &&
    analyzerBatch &&
    analyzerWindowAvgMs != null &&
    analyzerBatch.remaining > 0
      ? analyzerBatch.remaining * analyzerWindowAvgMs
      : undefined;

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
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 min-w-[11rem]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Non-analyzed companies
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {analyzerLoading ? '…' : (analyzerOverview?.nonAnalyzed ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={refreshBtnClass}
          disabled={countsLoading || analyzerLoading || busy !== null}
          onClick={() => {
            void loadCounts();
            void loadAnalyzerOverview();
          }}
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
            {(lastResult.duplicateRecordsMerged ?? 0) > 0
              ? `, ${lastResult.duplicateRecordsMerged} duplicate combined record(s) merged`
              : ''}
            .
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 max-w-xl">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Combine companies</h4>
          <p className="text-sm text-slate-500 mt-1">
            Attach new employers to an existing combined company when the website URL or exact name
            matches, create a new combined record otherwise, and merge duplicate combined companies.
            Only uncombined source rows are scanned for new attachments.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnClass}
              disabled={busy !== null}
              onClick={() => void run('companies')}
            >
              {busy === 'companies' ? 'Combining…' : 'Combine companies'}
            </button>
            <button
              type="button"
              className={secondaryBtnClass}
              disabled={busy !== null}
              onClick={() => void run('recombine-companies')}
            >
              {busy === 'recombine-companies' ? 'Recombining…' : 'Recombine companies'}
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Analyze companies</h4>
          <p className="text-sm text-slate-500 mt-1">
            Runs each non-analyzed employer through Grok research, waits for the response,
            then sends that research to local AI before starting the next company.
          </p>
          {analyzerBatch && (analyzerRunning || analyzerBatch.total > 0) ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {analyzerRunning
                    ? 'Analyzer running'
                    : analyzerBatch.stopped
                      ? 'Analyzer stopped'
                      : 'Last analyzer run'}
                </span>
                <span className="tabular-nums">{analyzerProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all"
                  style={{ width: `${analyzerProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {analyzerBatch.completed.toLocaleString()} completed ·{' '}
                {analyzerBatch.failed.toLocaleString()} failed ·{' '}
                {analyzerBatch.remaining.toLocaleString()} left
              </p>
              {analyzerWindowAvgMs != null ? (
                <p className="mt-1 text-xs text-slate-600">
                  ~{formatDurationMs(analyzerWindowAvgMs)} each (last {AVG_SAMPLE_SIZE})
                  {analyzerEtaMs != null ? ` · ~${formatDurationMs(analyzerEtaMs)} left` : ''}
                </p>
              ) : analyzerBatch.completed > 0 && analyzerBatch.completed < AVG_SAMPLE_SIZE ? (
                <p className="mt-1 text-xs text-slate-500">
                  Pace after {AVG_SAMPLE_SIZE} completed
                </p>
              ) : null}
              {analyzerBatch.current ? (
                <p className="mt-1 text-xs text-slate-500">
                  Current: {analyzerBatch.current.company_name || analyzerBatch.current.companypage}{' '}
                  ({analyzerBatch.current.stage === 'grok' ? 'Grok' : 'local AI'})
                </p>
              ) : null}
              {analyzerBatch.lastError ? (
                <p className="mt-1 text-xs text-red-700">{analyzerBatch.lastError}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnClass}
              disabled={
                busy !== null ||
                analyzerStarting ||
                reanalyzerStarting ||
                analyzerStopping ||
                analyzerRunning ||
                analyzerLoading ||
                (analyzerOverview?.nonAnalyzed ?? 0) === 0
              }
              onClick={() => void runAnalyzer()}
            >
              {analyzerRunning
                ? 'Batch running…'
                : analyzerStarting
                  ? 'Starting…'
                  : 'Analyze companies'}
            </button>
            <button
              type="button"
              className={secondaryBtnClass}
              disabled={
                busy !== null ||
                analyzerStarting ||
                reanalyzerStarting ||
                analyzerStopping ||
                analyzerRunning ||
                analyzerLoading ||
                (analyzerOverview?.reanalyzeEligible ?? 0) === 0
              }
              onClick={() => void runReanalyzer()}
            >
              {analyzerRunning
                ? 'Batch running…'
                : reanalyzerStarting
                  ? 'Starting…'
                  : 'Reanalyze companies'}
            </button>
            {analyzerRunning ? (
              <button
                type="button"
                className={stopBtnClass}
                disabled={
                  busy !== null ||
                  analyzerStarting ||
                  reanalyzerStarting ||
                  analyzerStopping ||
                  analyzerLoading
                }
                onClick={() => void stopAnalyzer()}
              >
                {analyzerStopping ? 'Stopping…' : 'Stop'}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Reanalyze runs local AI only on employers that already have Grok research (
            {(analyzerOverview?.reanalyzeEligible ?? 0).toLocaleString()} eligible), up to 4 in
            parallel. No new Grok searches.
          </p>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Combine jobs</h4>
          <p className="text-sm text-slate-500 mt-1">
            Attach new postings to an existing combined job when employer, title, and location match,
            or create a new combined record. Only uncombined source rows are scanned.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnClass}
              disabled={busy !== null}
              onClick={() => void run('jobs')}
            >
              {busy === 'jobs' ? 'Combining…' : 'Combine jobs'}
            </button>
            <button
              type="button"
              className={secondaryBtnClass}
              disabled={busy !== null}
              onClick={() => void run('recombine-jobs')}
            >
              {busy === 'recombine-jobs' ? 'Recombining…' : 'Recombine jobs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsPage;
