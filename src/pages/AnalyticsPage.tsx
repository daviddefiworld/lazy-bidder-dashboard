import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import PageHeader from '../components/layout/PageHeader';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/apiService';
import type { JobsCountByDayPlatformPoint, JobsCountByDayPoint } from '../types/analytics';
import {
  clampRelevantThreshold,
  readRelevantJobsThreshold,
  RELEVANT_THRESHOLD_DEFAULT,
  RELEVANT_THRESHOLD_MAX,
  RELEVANT_THRESHOLD_MIN,
  saveRelevantJobsThreshold
} from '../utils/analyticsPreferences';

const DAY_RANGE_OPTIONS = [7, 30, 90] as const;
type DayRange = (typeof DAY_RANGE_OPTIONS)[number];

function formatAxisDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

const selectClass =
  'rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

const thresholdInputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 tabular-nums shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

const secondaryButtonClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm hover:bg-slate-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60';

/** Main chart: total jobs vs relevant jobs overlay. */
const ALL_JOBS_BAR_COLOR = '#93c5fd';
const FIT_SCORE_OVER_30_COLOR = '#15803d';
/** Platform breakdown — same blue/green family as the main chart. */
const INDEED_PLATFORM_COLOR = '#60a5fa';
const GLASSDOOR_PLATFORM_COLOR = '#22c55e';
const RELEVANT_JOBS_LABEL = 'Relevant jobs';

function relevantJobsTooltip(threshold: number): string {
  return `Fit score > ${threshold}`;
}

const AnalyticsPage: React.FC = () => {
  const [days, setDays] = useState<DayRange>(30);
  const [appliedThreshold, setAppliedThreshold] = useState(readRelevantJobsThreshold);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [draftThreshold, setDraftThreshold] = useState(RELEVANT_THRESHOLD_DEFAULT);
  const [combinedSeries, setCombinedSeries] = useState<JobsCountByDayPoint[]>([]);
  const [combinedTotal, setCombinedTotal] = useState(0);
  const [combinedRelevantTotal, setCombinedRelevantTotal] = useState(0);
  const [platformSeries, setPlatformSeries] = useState<JobsCountByDayPlatformPoint[]>([]);
  const [platformTotals, setPlatformTotals] = useState({ indeed: 0, glassdoor: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [combined, byPlatform] = await Promise.all([
        apiService.getJobsCountByDay({ days, relevant_threshold: appliedThreshold }),
        apiService.getJobsCountByDayByPlatform({ days })
      ]);
      setCombinedSeries(combined.series);
      setCombinedTotal(combined.total);
      setCombinedRelevantTotal(combined.totalRelevant);
      setAppliedThreshold(combined.relevantThreshold);
      setPlatformSeries(byPlatform.series);
      setPlatformTotals(byPlatform.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setCombinedSeries([]);
      setCombinedTotal(0);
      setCombinedRelevantTotal(0);
      setPlatformSeries([]);
      setPlatformTotals({ indeed: 0, glassdoor: 0 });
    } finally {
      setLoading(false);
    }
  }, [days, appliedThreshold]);

  const openThresholdModal = () => {
    setDraftThreshold(appliedThreshold);
    setThresholdModalOpen(true);
  };

  const closeThresholdModal = () => {
    setThresholdModalOpen(false);
  };

  const applyThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const next = clampRelevantThreshold(draftThreshold);
    setAppliedThreshold(next);
    saveRelevantJobsThreshold(next);
    closeThresholdModal();
  };

  useEffect(() => {
    void load();
  }, [load]);

  const combinedChartData = useMemo(
    () => combinedSeries.map((p) => ({ ...p, label: formatAxisDate(p.date) })),
    [combinedSeries]
  );

  const platformChartData = useMemo(
    () => platformSeries.map((p) => ({ ...p, label: formatAxisDate(p.date) })),
    [platformSeries]
  );

  const combinedPeak = useMemo(
    () => Math.max(0, ...combinedSeries.map((p) => p.count)),
    [combinedSeries]
  );

  const platformTotal = platformTotals.indeed + platformTotals.glassdoor;

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Analytics"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openThresholdModal}
              disabled={loading}
              className={secondaryButtonClass}
              title={relevantJobsTooltip(appliedThreshold)}
            >
              Relevant jobs
            </button>
            <select
              className={selectClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) as DayRange)}
              disabled={loading}
              aria-label="Date range"
            >
              {DAY_RANGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  Last {n} days
                </option>
              ))}
            </select>
          </div>
        }
      />

      {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message="Loading job counts…" />
      ) : (
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">All jobs per day</h2>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>
                  Total:{' '}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {combinedTotal.toLocaleString()}
                  </span>
                </span>
                <span>
                  <span title={relevantJobsTooltip(appliedThreshold)} className="cursor-help">
                    {RELEVANT_JOBS_LABEL}:
                  </span>{' '}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {combinedRelevantTotal.toLocaleString()}
                  </span>
                </span>
                {combinedPeak > 0 && (
                  <span>
                    Peak day:{' '}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {combinedPeak.toLocaleString()}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {combinedTotal === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">
                No combined jobs with a post date in this period. Run combine jobs on the Manage →
                Actions page.
              </p>
            ) : (
              <div className="px-2 sm:px-4 py-6 h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedChartData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                    barGap={-52}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={days <= 7 ? 0 : days <= 30 ? 2 : 6}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(147, 197, 253, 0.25)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload as JobsCountByDayPoint & { label: string };
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
                            <p className="font-medium text-slate-900">{formatTooltipDate(row.date)}</p>
                            <p className="text-slate-600 tabular-nums">
                              All jobs: {row.count.toLocaleString()}
                            </p>
                            <p className="text-slate-600 tabular-nums">
                              {RELEVANT_JOBS_LABEL} ({relevantJobsTooltip(appliedThreshold)}):{' '}
                              {row.relevantCount.toLocaleString()}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="All jobs"
                      fill={ALL_JOBS_BAR_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={52}
                    />
                    <Bar
                      dataKey="relevantCount"
                      name={RELEVANT_JOBS_LABEL}
                      fill={FIT_SCORE_OVER_30_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={52}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-600">Indeed vs Glassdoor per day</h2>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span>
                  Indeed:{' '}
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {platformTotals.indeed.toLocaleString()}
                  </span>
                </span>
                <span>
                  Glassdoor:{' '}
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {platformTotals.glassdoor.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {platformTotal === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                No Indeed or Glassdoor crawl jobs with a post date in this period.
              </p>
            ) : (
              <div className="px-2 sm:px-4 py-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={days <= 7 ? 0 : days <= 30 ? 2 : 6}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(96, 165, 250, 0.15)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload as JobsCountByDayPlatformPoint & { label: string };
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
                            <p className="font-medium text-slate-900">{formatTooltipDate(row.date)}</p>
                            <p className="text-slate-600 tabular-nums">
                              Indeed: {row.indeed.toLocaleString()}
                            </p>
                            <p className="text-slate-600 tabular-nums">
                              Glassdoor: {row.glassdoor.toLocaleString()}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="indeed"
                      name="Indeed"
                      stackId="platform"
                      fill={INDEED_PLATFORM_COLOR}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="glassdoor"
                      name="Glassdoor"
                      stackId="platform"
                      fill={GLASSDOOR_PLATFORM_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      )}

      {thresholdModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={closeThresholdModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="relevant-jobs-threshold-title"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="relevant-jobs-threshold-title" className="text-base font-semibold text-slate-900">
                Relevant jobs threshold
              </h3>
              <button
                type="button"
                onClick={closeThresholdModal}
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={applyThreshold} className="space-y-4">
              <div>
                <label
                  htmlFor="relevant-threshold"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Minimum fit score
                </label>
                <p className="mb-2 text-sm text-slate-600">
                  Count jobs whose employer fit score is greater than this value.
                </p>
                <input
                  id="relevant-threshold"
                  type="number"
                  min={RELEVANT_THRESHOLD_MIN}
                  max={RELEVANT_THRESHOLD_MAX}
                  value={draftThreshold}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next)) {
                      setDraftThreshold(clampRelevantThreshold(next));
                    }
                  }}
                  className={thresholdInputClass}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeThresholdModal}
                  className="rounded border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default AnalyticsPage;
