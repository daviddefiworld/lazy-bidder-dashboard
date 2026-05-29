import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import PaginationBar from '../components/crawl/PaginationBar';
import apiService from '../services/apiService';
import type {
  UserActivityAction,
  UserActivityContext,
  UserActivityDailyPoint,
  UserActivityRow,
  UserActivitySummaryRow,
  UserActivityUserOption
} from '../types/userActivity';
import { formatRelativeTime } from '../utils/formatters';
import { getUserActivityLink } from '../utils/userActivityLinks';

const PAGE_SIZE = 10;

const ACTION_LABELS: Record<UserActivityAction, string> = {
  search: 'Search',
  sort: 'Sort',
  view_job: 'View job',
  view_company: 'View company',
  apply: 'Apply'
};

const CONTEXT_LABELS: Record<UserActivityContext, string> = {
  jobs: 'Jobs list',
  companies: 'Companies list',
  job: 'Job detail',
  company: 'Company detail'
};

const ACTION_COLORS: Record<UserActivityAction, string> = {
  search: '#2563eb',
  sort: '#7c3aed',
  view_job: '#0891b2',
  view_company: '#0d9488',
  apply: '#ea580c'
};

const selectClass =
  'rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

const refreshBtnClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition';

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

function formatDetails(row: UserActivityRow): string {
  const d = row.details;
  switch (row.action) {
    case 'search': {
      const parts = [
        d.query ? `query: "${String(d.query)}"` : null,
        d.skills ? `skills: "${String(d.skills)}"` : null,
        d.posted ? `posted: ${String(d.posted)}d` : null
      ].filter(Boolean);
      return parts.join(' · ') || 'Search';
    }
    case 'sort': {
      const parts = [
        d.sort ? `sort: ${String(d.sort)}` : null,
        d.order ? `order: ${String(d.order)}` : null,
        d.query ? `query: "${String(d.query)}"` : null
      ].filter(Boolean);
      return parts.join(' · ') || 'Sort changed';
    }
    case 'view_job':
      return [d.title, d.company_name, d.platform].filter(Boolean).map(String).join(' · ') || String(d.jobId ?? '');
    case 'view_company':
      return [d.company_name, d.companypage, d.platform].filter(Boolean).map(String).join(' · ') || 'Company';
    case 'apply':
      return [d.title, d.platform, d.apply_url ? 'external link' : null].filter(Boolean).map(String).join(' · ') || 'Apply';
    default:
      return '';
  }
}

const linkClass =
  'inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-900 hover:underline';

const ActivityDetailsCell: React.FC<{ row: UserActivityRow }> = ({ row }) => {
  const link = getUserActivityLink(row);

  return (
    <div className="space-y-1.5">
      <p className="text-slate-700 break-words">{formatDetails(row)}</p>
      {link ? (
        <Link to={link.to} className={linkClass} title={link.to}>
          {link.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
};

const SummaryTable: React.FC<{ rows: UserActivitySummaryRow[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No user activity in this period.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3 text-right">Search</th>
            <th className="px-4 py-3 text-right">Sort</th>
            <th className="px-4 py-3 text-right">View job</th>
            <th className="px-4 py-3 text-right">View company</th>
            <th className="px-4 py-3 text-right">Apply</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.userId} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900">{row.username}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.search}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.sort}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.view_job}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.view_company}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.apply}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserActivityPage: React.FC = () => {
  const [days, setDays] = useState(7);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState<UserActivityAction | ''>('');
  const [context, setContext] = useState<UserActivityContext | ''>('');
  const [page, setPage] = useState(1);

  const [userOptions, setUserOptions] = useState<UserActivityUserOption[]>([]);
  const [summary, setSummary] = useState<UserActivitySummaryRow[]>([]);
  const [dailySeries, setDailySeries] = useState<UserActivityDailyPoint[]>([]);
  const [dailyTotals, setDailyTotals] = useState<Omit<UserActivityDailyPoint, 'date'> | null>(null);
  const [items, setItems] = useState<UserActivityRow[]>([]);
  const [total, setTotal] = useState(0);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () => dailySeries.map((p) => ({ ...p, label: formatAxisDate(p.date) })),
    [dailySeries]
  );

  const chartPeak = useMemo(
    () => Math.max(0, ...dailySeries.map((p) => p.total)),
    [dailySeries]
  );

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setError(null);
    try {
      const baseParams = { days, userId: userId || undefined };
      const [users, summaryRows, daily] = await Promise.all([
        apiService.getUserActivityUsers({ days }),
        apiService.getUserActivitySummary(baseParams),
        apiService.getUserActivityDaily(baseParams)
      ]);
      setUserOptions(users);
      setSummary(summaryRows);
      setDailySeries(daily.series);
      setDailyTotals(daily.totals);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity overview');
      setUserOptions([]);
      setSummary([]);
      setDailySeries([]);
      setDailyTotals(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [days, userId]);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const data = await apiService.listUserActivityLog({
        days,
        userId: userId || undefined,
        action: action || undefined,
        context: context || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity log');
      setItems([]);
      setTotal(0);
    } finally {
      setLogLoading(false);
    }
  }, [days, userId, action, context, page]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadLog();
  }, [loadLog]);

  useEffect(() => {
    setPage(1);
  }, [days, userId, action, context]);

  const refreshAll = () => {
    void loadOverview();
    void loadLog();
  };

  return (
    <div>
      <PageHeader title="User activity" />

      <p className="mb-6 text-sm text-slate-600">
        Track search, sort, detail views, and apply clicks from dashboard users. Admin actions are not recorded. The log
        loads one page at a time for performance.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Period
          <select className={selectClass} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          User
          <select className={selectClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">All users</option>
            {userOptions.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.username}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Action
          <select
            className={selectClass}
            value={action}
            onChange={(e) => setAction(e.target.value as UserActivityAction | '')}
          >
            <option value="">All actions</option>
            {(Object.keys(ACTION_LABELS) as UserActivityAction[]).map((key) => (
              <option key={key} value={key}>
                {ACTION_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Context
          <select
            className={selectClass}
            value={context}
            onChange={(e) => setContext(e.target.value as UserActivityContext | '')}
          >
            <option value="">All contexts</option>
            {(Object.keys(CONTEXT_LABELS) as UserActivityContext[]).map((key) => (
              <option key={key} value={key}>
                {CONTEXT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={refreshBtnClass}
          onClick={refreshAll}
          disabled={overviewLoading || logLoading}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Actions per day</h3>
            <p className="mt-1 text-xs text-slate-500">
              Aggregated counts — does not load individual log rows.
            </p>
          </div>
          {dailyTotals ? (
            <p className="text-xs text-slate-500 tabular-nums">
              Period total: <span className="font-medium text-slate-800">{dailyTotals.total.toLocaleString()}</span>
            </p>
          ) : null}
        </div>

        {overviewLoading && dailySeries.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Loading chart…</p>
        ) : dailySeries.length === 0 || chartPeak === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No activity in this period.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date;
                    return typeof date === 'string' ? formatTooltipDate(date) : '';
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {(Object.keys(ACTION_LABELS) as UserActivityAction[]).map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={ACTION_LABELS[key]}
                    stackId="actions"
                    fill={ACTION_COLORS[key]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary by user</h3>
        {overviewLoading && summary.length === 0 ? (
          <p className="text-sm text-slate-500">Loading summary…</p>
        ) : (
          <SummaryTable rows={summary} />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Activity log</h3>
          <span className="text-xs text-slate-500">{total.toLocaleString()} events</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading activity…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No activity found for the selected filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600" title={row.createdAt}>
                      {formatRelativeTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.username}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-800 ring-1 ring-inset ring-primary-200">
                        {ACTION_LABELS[row.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{CONTEXT_LABELS[row.context]}</td>
                    <td className="px-4 py-3 max-w-xl">
                      <ActivityDetailsCell row={row} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <PaginationBar
            total={total}
            limit={PAGE_SIZE}
            offset={(page - 1) * PAGE_SIZE}
            onPageChange={setPage}
            loading={logLoading}
          />
        </div>
      </section>
    </div>
  );
};

export default UserActivityPage;
