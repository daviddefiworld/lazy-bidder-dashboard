import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import ScraperRunDetail from '../components/scraper/ScraperRunDetail';
import { useSocket } from '../contexts/SocketContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import {
  SCRAPER_COMMANDS,
  getScraperPlatform,
  type ScraperCommandDef,
  type ScraperCommandId,
  type ScraperPlatform,
  type ScraperRunState,
  type ScraperWorkerStatus
} from '../types/scraper';

const btnClass =
  'inline-flex items-center justify-center rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none transition';

const secondaryBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition';

const stopBtnClass =
  'inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition';

function formatTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
}

function statusBadgeClass(status: ScraperRunState['status']): string {
  switch (status) {
    case 'running':
      return 'bg-amber-100 text-amber-900';
    case 'completed':
      return 'bg-emerald-100 text-emerald-900';
    case 'failed':
      return 'bg-red-100 text-red-900';
    case 'cancelled':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function isActiveRun(run: ScraperRunState): boolean {
  return run.status === 'queued' || run.status === 'running';
}

function mergeRunIntoStatus(prev: ScraperWorkerStatus, run: ScraperRunState): ScraperWorkerStatus {
  const finished = !isActiveRun(run);
  const activeRuns = finished
    ? (prev.activeRuns ?? []).filter((r) => r.runId !== run.runId)
    : [...(prev.activeRuns ?? []).filter((r) => r.runId !== run.runId), run];
  const recentRuns = finished
    ? [run, ...prev.recentRuns.filter((r) => r.runId !== run.runId)].slice(0, 30)
    : prev.recentRuns;
  const busyPlatforms = [...new Set(activeRuns.filter(isActiveRun).map((r) => getScraperPlatform(r.commandId)))];

  return {
    ...prev,
    busy: busyPlatforms.length > 0,
    busyPlatforms,
    activeRuns,
    currentRun: activeRuns[0],
    recentRuns
  };
}

function CommandGroup({
  title,
  commands,
  platform,
  busyPlatforms,
  workerConnected,
  onRun
}: {
  title: string;
  commands: ScraperCommandDef[];
  platform: ScraperPlatform;
  busyPlatforms: ScraperPlatform[];
  workerConnected: boolean;
  onRun: (commandId: ScraperCommandId) => void;
}) {
  const platformBusy = busyPlatforms.includes(platform);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
      {!workerConnected ? (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 mb-3">
          Worker offline — orders will queue until the daemon connects.
        </p>
      ) : null}
      {platformBusy ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mb-3">
          An open {platform} order already exists.
        </p>
      ) : null}
      <ul className="space-y-2">
        {commands.map((cmd) => (
          <li
            key={cmd.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{cmd.label}</p>
              {cmd.description ? (
                <p className="text-xs text-slate-500 mt-0.5">{cmd.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className={cmd.group.includes('orchestration') ? btnClass : secondaryBtnClass}
              disabled={platformBusy}
              onClick={() => onRun(cmd.id)}
            >
              Run
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RunRow({ run }: { run: ScraperRunState }) {
  const platform = getScraperPlatform(run.commandId);

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(run.status)}`}>
        {run.status}
      </span>
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
        {platform}
      </span>
      <span className="font-medium text-slate-800">{run.commandId}</span>
      <span className="text-xs text-slate-500">{formatTime(run.startedAt)}</span>
      {run.finishedAt ? (
        <span className="text-xs text-slate-400">→ {formatTime(run.finishedAt)}</span>
      ) : null}
      {run.error ? <span className="text-xs text-red-600 truncate max-w-full">{run.error}</span> : null}
    </li>
  );
}

const ScrapingPage: React.FC = () => {
  const { isConnected: dashboardSocketConnected } = useSocket();
  const [status, setStatus] = useState<ScraperWorkerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stoppingOrderId, setStoppingOrderId] = useState<string | null>(null);

  const loadStatusFromApi = useCallback(async () => {
    try {
      const data = await apiService.getScraperStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scraper status');
    }
  }, []);

  const requestStatus = useCallback(() => {
    void loadStatusFromApi();
    if (socketService.getConnectionStatus()) {
      socketService.requestScraperStatus();
    }
  }, [loadStatusFromApi]);

  useEffect(() => {
    requestStatus();
  }, [requestStatus, dashboardSocketConnected]);

  useEffect(() => {
    const onStatus = (data: ScraperWorkerStatus) => setStatus(data);
    const onRunUpdated = (data: { run: ScraperRunState }) => {
      setStatus((prev) => (prev ? mergeRunIntoStatus(prev, data.run) : prev));
      if (data.run.status === 'cancelled' || data.run.status === 'completed' || data.run.status === 'failed') {
        setStoppingOrderId((id) => (id === data.run.runId ? null : id));
      }
    };
    const onOrderStopped = (data: { orderId: string }) => {
      setStoppingOrderId((id) => (id === data.orderId ? null : id));
    };
    const onBackendError = (data: { message: string; error: string }) => {
      setError(`${data.message}: ${data.error}`);
    };

    socketService.on('scraper:status', onStatus);
    socketService.on('scraper:run_updated', onRunUpdated);
    socketService.on('scraper:order_stopped', onOrderStopped);
    socketService.on('backend:error', onBackendError);

    return () => {
      socketService.off('scraper:status', onStatus);
      socketService.off('scraper:run_updated', onRunUpdated);
      socketService.off('scraper:order_stopped', onOrderStopped);
      socketService.off('backend:error', onBackendError);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(requestStatus, status?.busy ? 3000 : 10000);
    return () => window.clearInterval(interval);
  }, [requestStatus, status?.busy]);

  const workerConnected = Boolean(status?.connected);
  const busyPlatforms = status?.busyPlatforms ?? [];

  const indeedOrchestration = useMemo(
    () => SCRAPER_COMMANDS.filter((c) => c.group === 'indeed-orchestration'),
    []
  );
  const indeedSteps = useMemo(() => SCRAPER_COMMANDS.filter((c) => c.group === 'indeed-steps'), []);
  const glassdoorOrchestration = useMemo(
    () => SCRAPER_COMMANDS.filter((c) => c.group === 'glassdoor-orchestration'),
    []
  );
  const glassdoorSteps = useMemo(() => SCRAPER_COMMANDS.filter((c) => c.group === 'glassdoor-steps'), []);

  const handleRun = (commandId: ScraperCommandId) => {
    setError(null);
    socketService.runScraperCommand(commandId);
  };

  const handleStop = (orderId: string) => {
    setError(null);
    setStoppingOrderId(orderId);
    socketService.stopScraperOrder(orderId);
  };

  const activeRuns = useMemo(() => {
    const fromStatus = status?.activeRuns?.length
      ? status.activeRuns
      : status?.currentRun
        ? [status.currentRun]
        : [];
    return fromStatus.filter(isActiveRun);
  }, [status]);

  const displayRuns = useMemo(() => {
    const list: ScraperRunState[] = [...activeRuns];
    for (const r of status?.recentRuns ?? []) {
      if (!list.some((x) => x.runId === r.runId)) list.push(r);
    }
    return list.slice(0, 20);
  }, [status, activeRuns]);

  const workerStatusLabel = useMemo(() => {
    if (!workerConnected) return null;
    if (busyPlatforms.length === 0) return 'idle';
    if (busyPlatforms.length === 2) return 'running Indeed + Glassdoor';
    return `running ${busyPlatforms[0]}`;
  }, [workerConnected, busyPlatforms]);

  return (
    <div>
      <PageHeader title="Scraping" />
      <p className="mb-4 text-sm text-slate-600">
        Scraper runs are persisted as orders in the backend and stay in sync with the daemon (including after
        refresh or restart). Indeed and Glassdoor can run concurrently (one active order per platform). Start the
        worker with{' '}
        <code className="text-xs bg-slate-100 px-1 rounded">npm run daemon</code> in the scrapping project.
      </p>

      {!dashboardSocketConnected ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dashboard socket is disconnected. Reconnect to send commands.
        </p>
      ) : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Scraper worker</h3>
            <p className="text-sm text-slate-600 mt-1">
              {workerConnected ? (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                  Connected as <span className="font-medium">{status?.workerId}</span>
                  {status?.version ? ` · v${status.version}` : ''}
                  {workerStatusLabel ? ` · ${workerStatusLabel}` : ''}
                </>
              ) : (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-300 mr-1.5 align-middle" />
                  Not connected — run <code className="text-xs bg-slate-100 px-1 rounded">npm run daemon</code> in scrapping
                </>
              )}
            </p>
            {status?.connectedAt ? (
              <p className="text-xs text-slate-500 mt-1">Since {formatTime(status.connectedAt)}</p>
            ) : null}
          </div>
          <button type="button" className={secondaryBtnClass} onClick={requestStatus}>
            Refresh status
          </button>
        </div>

        {activeRuns.length > 0 ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active runs</p>
            {activeRuns.map((run) => (
              <div key={run.runId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="font-medium text-slate-800 capitalize">
                    {getScraperPlatform(run.commandId)}: {run.commandId}
                  </p>
                  <button
                    type="button"
                    className={stopBtnClass}
                    disabled={stoppingOrderId === run.runId}
                    onClick={() => handleStop(run.runId)}
                  >
                    {stoppingOrderId === run.runId ? 'Stopping…' : 'Stop'}
                  </button>
                </div>
                <ScraperRunDetail run={run} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <CommandGroup
          title="Indeed — full pipeline"
          commands={indeedOrchestration}
          platform="indeed"
          busyPlatforms={busyPlatforms}
          workerConnected={workerConnected}
          onRun={handleRun}
        />
        <CommandGroup
          title="Glassdoor — full pipeline"
          commands={glassdoorOrchestration}
          platform="glassdoor"
          busyPlatforms={busyPlatforms}
          workerConnected={workerConnected}
          onRun={handleRun}
        />
        <CommandGroup
          title="Indeed — steps"
          commands={indeedSteps}
          platform="indeed"
          busyPlatforms={busyPlatforms}
          workerConnected={workerConnected}
          onRun={handleRun}
        />
        <CommandGroup
          title="Glassdoor — steps"
          commands={glassdoorSteps}
          platform="glassdoor"
          busyPlatforms={busyPlatforms}
          workerConnected={workerConnected}
          onRun={handleRun}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent runs</h3>
        {displayRuns.length === 0 ? (
          <p className="text-sm text-slate-500">No runs yet.</p>
        ) : (
          <ul className="space-y-2">
            {displayRuns.map((run) => (
              <RunRow key={run.runId} run={run} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ScrapingPage;
