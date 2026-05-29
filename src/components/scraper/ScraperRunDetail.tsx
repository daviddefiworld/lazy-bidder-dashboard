import React from 'react';
import type { ScraperItemProgress, ScraperRunState, ScraperStep, ScraperStepStatus } from '../../types/scraper';

function stepStatusIcon(status: ScraperStepStatus): string {
  switch (status) {
    case 'completed':
      return '✓';
    case 'running':
      return '●';
    case 'failed':
      return '✕';
    default:
      return '○';
  }
}

function stepStatusClass(status: ScraperStepStatus): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'running':
      return 'text-primary-700 bg-primary-50 border-primary-200';
    case 'failed':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-400 bg-slate-50 border-slate-200';
  }
}

function stepItems(step: ScraperStep): ScraperItemProgress[] {
  if (step.items?.length) return step.items;
  if (step.item) return [step.item];
  return [];
}

function ItemProgressBar({ item, emphasized }: { item: ScraperItemProgress; emphasized?: boolean }) {
  const hasTotal = item.total != null && item.total > 0;
  const pct = hasTotal ? Math.min(100, Math.round((item.current / item.total!) * 100)) : 0;

  return (
    <div className={`space-y-1 ${emphasized ? 'mt-2' : 'mt-1.5'}`}>
      <div className="flex justify-between text-xs text-slate-600">
        <span className={emphasized ? 'font-medium text-slate-700' : undefined}>{item.label}</span>
        <span className="tabular-nums">
          {hasTotal ? `${item.current}/${item.total}` : item.current}
          {item.suffix ? (
            <span className="ml-1.5 text-emerald-700 font-medium">{item.suffix}</span>
          ) : null}
        </span>
      </div>
      {hasTotal ? (
        <div className={`rounded-full bg-slate-200 overflow-hidden ${emphasized ? 'h-2' : 'h-1.5'}`}>
          <div
            className="h-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function StepRow({ step, compact }: { step: ScraperStep; compact?: boolean }) {
  const icon = stepStatusIcon(step.status);
  const statusClass = stepStatusClass(step.status);
  const items = stepItems(step);
  const jobsItem = items.find((i) => i.label.toLowerCase() === 'jobs');
  const otherItems = items.filter((i) => i !== jobsItem);

  return (
    <li
      className={`rounded-lg border px-3 ${compact ? 'py-2' : 'py-2.5'} ${
        step.status === 'running' ? 'border-primary-200 bg-primary-50/40' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${statusClass}`}
          aria-hidden
        >
          {step.status === 'running' ? (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
          ) : (
            icon
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm leading-snug ${
              step.status === 'pending' ? 'text-slate-400' : 'text-slate-800 font-medium'
            }`}
          >
            <span className="text-slate-400 font-normal mr-1.5">{step.index}.</span>
            {step.title}
          </p>
          {step.message ? (
            <p
              className={`mt-0.5 text-xs ${
                step.status === 'failed' ? 'text-red-600' : 'text-slate-500'
              }`}
            >
              {step.message}
            </p>
          ) : null}
          {step.status === 'running' && items.length > 0 ? (
            <div className="space-y-0.5">
              {otherItems.map((item) => (
                <ItemProgressBar key={item.label} item={item} />
              ))}
              {jobsItem ? <ItemProgressBar item={jobsItem} emphasized /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export const ScraperRunDetail: React.FC<{ run: ScraperRunState; compact?: boolean }> = ({
  run,
  compact = false
}) => {
  const progress = run.runProgress;
  const steps = progress?.steps ?? [];

  if (steps.length === 0 && run.status === 'queued') {
    return <p className="text-sm text-slate-500">Waiting to start…</p>;
  }

  if (steps.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-slate-600 capitalize">{run.status}</p>
        {run.error ? <p className="text-sm text-red-700">{run.error}</p> : null}
      </div>
    );
  }

  const summary =
    progress && progress.stepTotal > 0
      ? `${steps.filter((s) => s.status === 'completed').length}/${progress.stepTotal} steps`
      : null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {summary ? (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{summary}</p>
      ) : null}
      <ol className="space-y-1.5">
        {steps.map((step) => (
          <StepRow key={step.index} step={step} compact={compact} />
        ))}
      </ol>
      {run.error ? <p className="text-sm text-red-700">{run.error}</p> : null}
    </div>
  );
};

export default ScraperRunDetail;
